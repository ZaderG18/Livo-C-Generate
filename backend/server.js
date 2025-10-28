import express from "express"
import cors from "cors"
import multer from "multer"
import pdfParse from "pdf-parse"
import puppeteer from "puppeteer"
import ejs from "ejs"
import { createClient } from "@supabase/supabase-js"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import dotenv from "dotenv"
import { z } from "zod"
import rateLimit from "express-rate-limit"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuração do Multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Muitas requisições, tente novamente mais tarde", code: "RATE_LIMIT_EXCEEDED" },
})

const contractDataSchema = z.object({
  empresa: z.string().optional(),
  cnpj_empresa: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val), {
      message: "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX",
    }),
  condominio: z.string().min(1, "Nome do condomínio é obrigatório"),
  cnpj_condominio: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_assinatura: z.string().min(1, "Data de assinatura é obrigatória"),
})

// Função auxiliar para extrair dados do PDF usando regex
function extractDataFromText(text) {
  const data = {
    empresa: "",
    cnpj_empresa: "",
    condominio: "",
    cnpj_condominio: "",
    valor: "",
    data_assinatura: "",
  }

  try {
    const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g
    const cnpjs = text.match(cnpjRegex) || []

    // Format CNPJs properly
    const formatCNPJ = (cnpj) => {
      const numbers = cnpj.replace(/\D/g, "")
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    }

    const empresaKeywords = ["empresa", "prestadora", "contratada", "fornecedor"]
    const condominioKeywords = ["condomínio", "contratante", "cliente"]

    // Try to identify which CNPJ belongs to which entity
    for (const cnpj of cnpjs) {
      const cnpjIndex = text.indexOf(cnpj)
      const contextBefore = text.substring(Math.max(0, cnpjIndex - 100), cnpjIndex).toLowerCase()
      const contextAfter = text.substring(cnpjIndex, Math.min(text.length, cnpjIndex + 100)).toLowerCase()
      const context = contextBefore + contextAfter

      if (empresaKeywords.some((keyword) => context.includes(keyword)) && !data.cnpj_empresa) {
        data.cnpj_empresa = formatCNPJ(cnpj)
      } else if (condominioKeywords.some((keyword) => context.includes(keyword)) && !data.cnpj_condominio) {
        data.cnpj_condominio = formatCNPJ(cnpj)
      } else if (!data.cnpj_condominio) {
        data.cnpj_condominio = formatCNPJ(cnpj)
      } else if (!data.cnpj_empresa) {
        data.cnpj_empresa = formatCNPJ(cnpj)
      }
    }

    const valorRegex = /R\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi
    const valorMatches = text.match(valorRegex) || []
    if (valorMatches.length > 0) {
      // Get the largest value (likely the contract total)
      const valores = valorMatches.map((v) => {
        const num = v.replace(/[^\d,]/g, "").replace(",", ".")
        return { original: v, numeric: Number.parseFloat(num) }
      })
      const maxValor = valores.reduce((max, curr) => (curr.numeric > max.numeric ? curr : max))
      data.valor = maxValor.original.replace("R$", "").trim()
    }

    const dataRegex = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/
    const dataMatch = text.match(dataRegex)
    if (dataMatch) {
      const [, dia, mes, ano] = dataMatch
      data.data_assinatura = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    }

    const condominioPatterns = [
      /Condomínio\s+([A-Za-zÀ-ÿ0-9\s]+?)(?:\n|,|\.|\s{2,}|CNPJ)/i,
      /Contratante:\s*([A-Za-zÀ-ÿ0-9\s]+?)(?:\n|,|\.|\s{2,}|CNPJ)/i,
      /Cliente:\s*([A-Za-zÀ-ÿ0-9\s]+?)(?:\n|,|\.|\s{2,}|CNPJ)/i,
    ]

    for (const pattern of condominioPatterns) {
      const match = text.match(pattern)
      if (match && !data.condominio) {
        data.condominio = match[1].trim()
        break
      }
    }

    const empresaPatterns = [
      /(?:Empresa|Razão Social):\s*([A-Za-zÀ-ÿ0-9\s]+?)(?:\n|,|\.|\s{2,}|CNPJ)/i,
      /Contratada:\s*([A-Za-zÀ-ÿ0-9\s]+?)(?:\n|,|\.|\s{2,}|CNPJ)/i,
      /Prestadora:\s*([A-Za-zÀ-ÿ0-9\s]+?)(?:\n|,|\.|\s{2,}|CNPJ)/i,
    ]

    for (const pattern of empresaPatterns) {
      const match = text.match(pattern)
      if (match && !data.empresa) {
        data.empresa = match[1].trim()
        break
      }
    }
  } catch (error) {
    console.error("Erro durante extração:", error)
  }

  return data
}

// Endpoint 1: Extração de dados do PDF
app.post("/api/extract", apiLimiter, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo PDF foi enviado",
        code: "NO_FILE",
      })
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        error: "Apenas arquivos PDF são aceitos",
        code: "INVALID_FILE_TYPE",
      })
    }

    let pdfData
    try {
      pdfData = await pdfParse(req.file.buffer)
    } catch (parseError) {
      return res.status(400).json({
        error: "Não foi possível processar o PDF. O arquivo pode estar protegido ou corrompido.",
        code: "PDF_PARSE_ERROR",
        details: parseError.message,
      })
    }

    const text = pdfData.text

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        error: "O PDF não contém texto extraível. Pode ser baseado em imagem.",
        code: "NO_TEXT_CONTENT",
      })
    }

    const extractedData = extractDataFromText(text)

    const validationIssues = []
    if (extractedData.cnpj_empresa && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(extractedData.cnpj_empresa)) {
      validationIssues.push("CNPJ da empresa em formato inválido")
    }
    if (extractedData.cnpj_condominio && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(extractedData.cnpj_condominio)) {
      validationIssues.push("CNPJ do condomínio em formato inválido")
    }

    res.json({
      ...extractedData,
      _validation_issues: validationIssues.length > 0 ? validationIssues : undefined,
    })
  } catch (error) {
    console.error("Erro ao extrair dados do PDF:", error)
    res.status(500).json({
      error: "Erro interno ao processar o PDF",
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Endpoint 2: Geração do contrato PDF
app.post("/api/generate", apiLimiter, async (req, res) => {
  let browser = null

  try {
    const contractData = req.body

    const validation = contractDataSchema.safeParse(contractData)

    if (!validation.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        code: "VALIDATION_ERROR",
        details: validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      })
    }

    const sanitize = (str) => {
      if (!str) return ""
      return str
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;")
    }

    const sanitizedData = {
      empresa: sanitize(contractData.empresa),
      cnpj_empresa: sanitize(contractData.cnpj_empresa),
      condominio: sanitize(contractData.condominio),
      cnpj_condominio: sanitize(contractData.cnpj_condominio),
      valor: sanitize(contractData.valor),
      data_assinatura: sanitize(contractData.data_assinatura),
    }

    // Carregar template EJS
    const templatePath = join(__dirname, "templates", "contract_template.ejs")
    const template = await readFile(templatePath, "utf-8")

    // Renderizar HTML com os dados
    const html = ejs.render(template, {
      contract: sanitizedData,
      formatDate: (dateString) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      },
      formatCurrency: (value) => {
        if (!value) return "R$ 0,00"
        return `R$ ${value}`
      },
    })

    // Gerar PDF com Puppeteer
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    })

    await browser.close()
    browser = null

    // Upload para Supabase Storage
    const bucketName = process.env.SUPABASE_BUCKET_NAME || "contracts-pdfs"
    const fileName = `contract-${Date.now()}-${contractData.condominio.replace(/\s+/g, "-")}.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
      })

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    res.json({
      pdf_url: urlData.publicUrl,
      message: "Contrato gerado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao gerar contrato:", error)

    if (browser) {
      await browser.close()
    }

    res.status(500).json({
      error: "Erro interno ao gerar o contrato",
      code: "GENERATION_ERROR",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Livo Contract Backend" })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📝 Endpoints disponíveis:`)
  console.log(`   POST http://localhost:${PORT}/api/extract`)
  console.log(`   POST http://localhost:${PORT}/api/generate`)
  console.log(`   GET  http://localhost:${PORT}/health`)
})
