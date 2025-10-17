import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/contracts"

export interface ExtractedData {
  empresa?: string
  cnpj_empresa?: string
  condominio: string
  cnpj_condominio: string
  valor: string
  data_assinatura: string
}

export interface GenerateContractRequest {
  condominio: string
  cnpj_condominio: string
  empresa?: string
  cnpj_empresa?: string
  valor: string
  data_assinatura: string
}

export function isApiConfigured(): boolean {
  return true
}

// Extract data from PDF
export async function extractDataFromPDF(file: File): Promise<ExtractedData> {
  const formData = new FormData()
  formData.append("pdf", file)

  try {
    const response = await axios.post(`${API_BASE_URL}/extract`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  } catch (error) {
    console.error("[v0] API Error:", error)
    throw error
  }
}

// Generate contract PDF
export async function generateContractPDF(data: GenerateContractRequest): Promise<{ pdf_url: string }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate`, data)
    return response.data
  } catch (error) {
    console.error("[v0] API Error:", error)
    throw error
  }
}
