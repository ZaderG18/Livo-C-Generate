import { createBrowserClient } from "@supabase/ssr"

export interface Contract {
  id: string
  condominio: string
  cnpj_condominio: string
  empresa?: string
  cnpj_empresa?: string
  valor: string
  data_assinatura: string
  pdf_url?: string
  status: "pending" | "generated" | "signed" | "cancelled"
  created_at: string
}

export interface CreateContractData {
  condominio: string
  cnpj_condominio: string
  empresa?: string
  cnpj_empresa?: string
  valor: string
  data_assinatura: string
  pdf_url?: string
  status?: string
}

export interface ContractFilters {
  startDate?: string
  endDate?: string
  condominio?: string
  status?: string
}

export interface ApiError extends Error {
  code?: string
  details?: unknown
}

// Get Supabase client
function getSupabaseClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// List all contracts
export async function listContracts() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("contracts").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Contract[]
}

// Get contract by ID
export async function getContract(id: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("contracts").select("*").eq("id", id).single()

  if (error) throw error
  return data as Contract
}

// Create new contract
export async function createContract(contractData: CreateContractData) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("contracts").insert([contractData]).select().single()

  if (error) throw error
  return data as Contract
}

// Update contract
export async function updateContract(id: string, updates: Partial<CreateContractData>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("contracts").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data as Contract
}

// Delete contract
export async function deleteContract(id: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("contracts").delete().eq("id", id)

  if (error) throw error
}

// Filter contracts
export async function filterContracts(filters: ContractFilters) {
  const supabase = getSupabaseClient()
  let query = supabase.from("contracts").select("*")

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate)
  }
  if (filters.condominio) {
    query = query.ilike("condominio", `%${filters.condominio}%`)
  }
  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data as Contract[]
}
