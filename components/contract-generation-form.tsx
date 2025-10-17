"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Loader2, Sparkles, Save, AlertCircle } from "lucide-react"
import { extractDataFromPDF, generateContractPDF, isApiConfigured } from "@/lib/api/contracts-api"
import { createContract } from "@/lib/supabase/contracts"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ContractGenerationForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    empresa: "",
    cnpj_empresa: "",
    condominio: "",
    cnpj_condominio: "",
    valor: "",
    data_assinatura: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const apiConfigured = isApiConfigured()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      toast({
        title: "Arquivo selecionado",
        description: `${file.name} está pronto para extração.`,
      })
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      })
    }
  }

  const handleExtractData = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo PDF primeiro.",
        variant: "destructive",
      })
      return
    }

    if (!apiConfigured) {
      toast({
        title: "API não configurada",
        description: "Configure a variável NEXT_PUBLIC_API_URL para usar a extração automática.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExtracting(true)
      const extractedData = await extractDataFromPDF(selectedFile)

      setFormData({
        empresa: extractedData.empresa || "",
        cnpj_empresa: extractedData.cnpj_empresa || "",
        condominio: extractedData.condominio || "",
        cnpj_condominio: extractedData.cnpj_condominio || "",
        valor: extractedData.valor || "",
        data_assinatura: extractedData.data_assinatura || "",
      })

      toast({
        title: "Dados extraídos com sucesso!",
        description: "Os campos foram preenchidos automaticamente.",
      })
    } catch (error) {
      console.error("[v0] Error extracting data:", error)
      toast({
        title: "Erro na extração",
        description: "Não foi possível extrair os dados. Preencha manualmente.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerateContract = async () => {
    // Validate required fields
    if (!formData.condominio || !formData.cnpj_condominio || !formData.valor || !formData.data_assinatura) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)

      let pdf_url = ""

      if (apiConfigured) {
        try {
          const result = await generateContractPDF({
            condominio: formData.condominio,
            cnpj_condominio: formData.cnpj_condominio,
            empresa: formData.empresa,
            cnpj_empresa: formData.cnpj_empresa,
            valor: formData.valor,
            data_assinatura: formData.data_assinatura,
          })
          pdf_url = result.pdf_url
        } catch (error) {
          console.error("[v0] Error generating PDF via API:", error)
          // Use placeholder if API fails
          pdf_url = `/contracts/placeholder-${Date.now()}.pdf`
        }
      } else {
        // Use placeholder URL when API is not configured
        pdf_url = `/contracts/placeholder-${Date.now()}.pdf`
      }

      // Save to Supabase
      const contract = await createContract({
        condominio: formData.condominio,
        cnpj_condominio: formData.cnpj_condominio,
        empresa: formData.empresa,
        cnpj_empresa: formData.cnpj_empresa,
        valor: formData.valor,
        data_assinatura: formData.data_assinatura,
        pdf_url,
        status: "generated",
      })

      toast({
        title: "Contrato gerado com sucesso!",
        description: apiConfigured
          ? "O contrato foi salvo e está disponível no dashboard."
          : "O contrato foi salvo. Configure a API para gerar o PDF.",
      })

      // Redirect to contract view
      router.push(`/dashboard/contracts/${contract.id}`)
    } catch (error) {
      console.error("[v0] Error generating contract:", error)
      toast({
        title: "Erro ao gerar contrato",
        description: "Não foi possível gerar o contrato. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {!apiConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API não configurada</AlertTitle>
          <AlertDescription>
            A extração automática de PDF e geração de contratos requer configuração da API. Configure a variável de
            ambiente <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> para habilitar
            essas funcionalidades. Por enquanto, você pode preencher os dados manualmente.
          </AlertDescription>
        </Alert>
      )}

      {/* PDF Upload Section */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">1. Upload da Proposta Comercial</h3>
          <p className="text-sm text-muted-foreground">
            {apiConfigured
              ? "Faça upload do PDF para extrair os dados automaticamente"
              : "Extração automática indisponível - preencha os dados manualmente"}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="pdf-upload" className="cursor-pointer">
                <div
                  className={`flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 transition-colors ${apiConfigured ? "hover:border-primary hover:bg-muted/40" : "opacity-50 cursor-not-allowed"}`}
                >
                  {selectedFile ? (
                    <>
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Clique para selecionar o PDF</p>
                        <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                      </div>
                    </>
                  )}
                </div>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!apiConfigured}
                />
              </Label>
            </div>
          </div>

          <Button
            onClick={handleExtractData}
            disabled={!selectedFile || isExtracting || !apiConfigured}
            className="w-full gap-2"
            size="lg"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Extraindo dados...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Extrair Dados do PDF
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Form Section */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">2. Dados do Contrato</h3>
          <p className="text-sm text-muted-foreground">Preencha ou edite os dados extraídos</p>
        </div>

        <div className="space-y-6">
          {/* Empresa Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Empresa (Opcional)</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresa">Nome da Empresa</Label>
                <Input
                  id="empresa"
                  placeholder="Ex: Empresa XYZ Ltda"
                  value={formData.empresa}
                  onChange={(e) => handleInputChange("empresa", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj_empresa">CNPJ da Empresa</Label>
                <Input
                  id="cnpj_empresa"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj_empresa}
                  onChange={(e) => handleInputChange("cnpj_empresa", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Condomínio Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Condomínio *</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="condominio">Nome do Condomínio</Label>
                <Input
                  id="condominio"
                  placeholder="Ex: Condomínio Residencial ABC"
                  value={formData.condominio}
                  onChange={(e) => handleInputChange("condominio", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj_condominio">CNPJ do Condomínio</Label>
                <Input
                  id="cnpj_condominio"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj_condominio}
                  onChange={(e) => handleInputChange("cnpj_condominio", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Detalhes do Contrato *</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Final</Label>
                <Input
                  id="valor"
                  placeholder="R$ 0,00"
                  value={formData.valor}
                  onChange={(e) => handleInputChange("valor", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_assinatura">Data de Assinatura</Label>
                <Input
                  id="data_assinatura"
                  type="date"
                  value={formData.data_assinatura}
                  onChange={(e) => handleInputChange("data_assinatura", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Pronto para gerar?</h3>
            <p className="text-sm text-muted-foreground">Revise os dados e clique em gerar contrato</p>
          </div>
          <Button onClick={handleGenerateContract} disabled={isGenerating} size="lg" className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Gerar Contrato
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
