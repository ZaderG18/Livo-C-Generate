"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, LogOut, Plus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContractsList } from "@/components/contracts-list"
import Link from "next/link"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[v0] Checking authentication")
      const supabase = createClient()

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log("[v0] Auth check result", { session: !!session, error })

        if (error) {
          console.error("[v0] Auth check error:", error)
          router.push("/")
          return
        }

        if (!session) {
          console.log("[v0] No session found, redirecting to login")
          router.push("/")
        } else {
          console.log("[v0] Session found, user authenticated")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("[v0] Auth check exception:", error)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    console.log("[v0] Logout initiated")
    const supabase = createClient()
    await supabase.auth.signOut()
    console.log("[v0] Logout complete, redirecting")
    router.push("/")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Livo Contract Generator</h1>
              <p className="text-xs text-muted-foreground">Gerador de Contratos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-balance">Contratos</h2>
            <p className="text-muted-foreground text-pretty">Gerencie todos os seus contratos em um só lugar</p>
          </div>
          <Link href="/dashboard/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Novo Contrato
            </Button>
          </Link>
        </div>

        <ContractsList />
      </main>

      <footer className="mt-16 border-t border-border/50 bg-card/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Livo Contract Generator - Gerador de Contratos Profissionais</p>
        </div>
      </footer>
    </div>
  )
}
