export interface ContractFilters {
  condominio?: string
  status?: string
  empresa?: string
  cnpj_empresa?: string
  cnpj_condominio?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ExtractedContractData {
  empresa: string
  cnpj_empresa: string
  condominio: string
  cnpj_condominio: string
  valor: string
  data_assinatura: string
}

export interface GenerateContractResponse {
  pdf_url: string
  message: string
}
