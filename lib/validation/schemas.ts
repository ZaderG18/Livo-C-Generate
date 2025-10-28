import { z } from "zod"

// CNPJ validation regex: XX.XXX.XXX/XXXX-XX
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

// Monetary value regex: accepts R$, spaces, dots and commas
const monetaryRegex = /^R?\$?\s?[\d.,]+$/

export const contractFormSchema = z.object({
  empresa: z.string().optional(),
  cnpj_empresa: z
    .string()
    .optional()
    .refine((val) => !val || cnpjRegex.test(val), {
      message: "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX",
    }),
  condominio: z.string().min(1, "Nome do condomínio é obrigatório"),
  cnpj_condominio: z.string().regex(cnpjRegex, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX"),
  valor: z.string().min(1, "Valor é obrigatório").regex(monetaryRegex, "Formato de valor inválido"),
  data_assinatura: z
    .string()
    .min(1, "Data de assinatura é obrigatória")
    .refine(
      (date) => {
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      { message: "Data inválida" },
    ),
})

export type ContractFormData = z.infer<typeof contractFormSchema>

// Helper function to format CNPJ
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 14) {
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return value
}

// Helper function to normalize monetary value
export function normalizeMonetaryValue(value: string): string {
  return value.replace(/[^\d,]/g, "").replace(",", ".")
}
