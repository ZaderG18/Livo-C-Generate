"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Loader2, Printer, Trash2 } from "lucide-react"
import Link from "next/link"
import { getContract, deleteContract, updateContract, type Contract } from "@/lib/supabase/contracts"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ContractViewPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [contract, setContract] = useState<Contract | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const contractId = params.id as string

  useEffect(() => {
    const checkAuthAndLoadContract = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/")
        return
      }

      await loadContract()
    }

    checkAuthAndLoadContract()
  }, [contractId, router])

  const loadContract = async () => {
    try {
      setIsLoading(true)
      const data = await getContract(contractId)
      setContract(data)
    } catch (error) {
      console.error("[v0] Error loading contract:", error)
      toast({
        title: "Erro ao carregar contrato",
        description: "Não foi possível carregar os dados do contrato.",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!contract) return

    try {
      setIsUpdatingStatus(true)
      await updateContract(contract.id, { status: newStatus })
      setContract({ ...contract, status: newStatus as Contract["status"] })
      toast({
        title: "Status atualizado",
        description: "O status do contrato foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!contract) return

    const confirmed = window.confirm("Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.")
    if (!confirmed) return

    try {
      setIsDeleting(true)
      await deleteContract(contract.id)
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error deleting contract:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    if (contract?.pdf_url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a")
      link.href = contract.pdf_url
      link.download = `contrato-${contract.condominio}-${contract.id}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download iniciado",
        description: "O PDF do contrato está sendo baixado.",
      })
    }
  }

  const handlePrint = () => {
    if (contract?.pdf_url) {
      const printWindow = window.open(contract.pdf_url, "_blank")
      printWindow?.print()
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      generated: { variant: "default", label: "Gerado" },
      signed: { variant: "outline", label: "Assinado" },
      cancelled: { variant: "destructive", label: "Cancelado" },
    }

    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (value: string) => {
    const num = Number.parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."))
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando contrato...</p>
        </div>
      </div>
    )
  }

  if (!contract) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Detalhes do Contrato</h1>
              <p className="text-xs text-muted-foreground">Visualizar e gerenciar contrato</p>
            </div>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{contract.condominio}</h2>
                  {getStatusBadge(contract.status)}
                </div>
                <p className="text-sm text-muted-foreground">Criado em {formatDate(contract.created_at)}</p>
              </div>
              <div className="flex gap-2">
                {contract.pdf_url && (
                  <>
                    <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleDownload} title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isDeleting} title="Excluir">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Status Management */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gerenciar Status</h3>
            <div className="flex items-center gap-4">
              <Select value={contract.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="generated">Gerado</SelectItem>
                  <SelectItem value="signed">Assinado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </Card>

          {/* Contract Details */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Condomínio Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Condomínio</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{contract.condominio}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{contract.cnpj_condominio}</p>
                </div>
              </div>
            </Card>

            {/* Empresa Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações da Empresa</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{contract.empresa || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{contract.cnpj_empresa || "Não informado"}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Financial Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detalhes Financeiros</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor do Contrato</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(contract.valor)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data de Assinatura</p>
                <p className="text-2xl font-semibold">{formatDate(contract.data_assinatura)}</p>
              </div>
            </div>
          </Card>

          {/* PDF Viewer */}
          {contract.pdf_url && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Visualização do Contrato</h3>
              <div className="aspect-[8.5/11] w-full overflow-hidden rounded-lg border bg-muted">
                <iframe src={contract.pdf_url} className="h-full w-full" title="Visualização do Contrato" />
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
