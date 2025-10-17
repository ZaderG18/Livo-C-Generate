import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("pdf") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // For now, return mock data as a placeholder
    // You can integrate libraries like pdf-parse or call external AI services

    // Mock extracted data - replace with actual PDF parsing
    const extractedData = {
      empresa: "Empresa Exemplo Ltda",
      cnpj_empresa: "12.345.678/0001-90",
      condominio: "Condomínio Residencial Exemplo",
      cnpj_condominio: "98.765.432/0001-10",
      valor: "R$ 15.000,00",
      data_assinatura: new Date().toISOString().split("T")[0],
    }

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error("[v0] Error in extract API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
