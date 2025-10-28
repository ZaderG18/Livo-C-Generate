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

  // Regex para CNPJ (formato: XX.XXX.XXX/XXXX-XX)
  const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g
  const cnpjs = text.match(cnpjRegex) || []

  // Primeiro CNPJ encontrado é do condomínio, segundo é da empresa
  if (cnpjs.length > 0) data.cnpj_condominio = cnpjs[0]
  if (cnpjs.length > 1) data.cnpj_empresa = cnpjs[1]

  // Regex para valores monetários (R$ X.XXX,XX)
  const valorRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/
  const valorMatch = text.match(valorRegex)
  if (valorMatch) data.valor = valorMatch[1]

  // Regex para datas (DD/MM/AAAA)
  const dataRegex = /(\d{2}\/\d{2}\/\d{4})/
  const dataMatch = text.match(dataRegex)
  if (dataMatch) {
    // Converter DD/MM/AAAA para AAAA-MM-DD
    const [dia, mes, ano] = dataMatch[1].split("/")
    data.data_assinatura = `${ano}-${mes}-${dia}`
  }

  // Tentar extrair nome do condomínio (procurar por "Condomínio" seguido de texto)
  const condominioRegex = /Condomínio\s+([A-Za-zÀ-ÿ\s]+?)(?:\n|,|\.|\s{2,})/i
  const condominioMatch = text.match(condominioRegex)
  if (condominioMatch) data.condominio = condominioMatch[1].trim()

  // Tentar extrair nome da empresa (procurar por "Empresa" ou "Razão Social")
  const empresaRegex = /(?:Empresa|Razão Social):\s*([A-Za-zÀ-ÿ\s]+?)(?:\n|,|\.|\s{2,})/i
  const empresaMatch = text.match(empresaRegex)
  if (empresaMatch) data.empresa = empresaMatch[1].trim()

  return data
}

// Endpoint 1: Extração de dados do PDF
app.post("/api/extract", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo PDF foi enviado" })
    }

    // Extrair texto do PDF
    const pdfData = await pdfParse(req.file.buffer)
    const text = pdfData.text

    // Extrair dados usando regex
    const extractedData = extractDataFromText(text)

    res.json(extractedData)
  } catch (error) {
    console.error("Erro ao extrair dados do PDF:", error)
    res.status(500).json({
      error: "Erro ao processar o PDF",
      details: error.message,
    })
  }
})

// Endpoint 2: Geração do contrato PDF
app.post("/api/generate", async (req, res) => {
  let browser = null

  try {
    const contractData = req.body

    // Validar dados obrigatórios
    const requiredFields = ["empresa", "cnpj_empresa", "condominio", "cnpj_condominio", "valor", "data_assinatura"]
    const missingFields = requiredFields.filter((field) => !contractData[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Campos obrigatórios faltando",
        missing: missingFields,
      })
    }

    // Carregar template EJS
    const templatePath = join(__dirname, "templates", "contract_template.ejs")
    const template = await readFile(templatePath, "utf-8")

    // Renderizar HTML com os dados
    const html = ejs.render(template, {
      contract: contractData,
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
      error: "Erro ao gerar o contrato",
      details: error.message,
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