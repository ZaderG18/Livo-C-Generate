"use client"

import { useState, useEffect } from "react"
import { listContracts, filterContracts, type Contract } from "@/lib/supabase/contracts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Download, Eye, Search, Filter, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export function ContractsList() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dbError, setDbError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      setIsLoading(true)
      setDbError(false)
      const data = await listContracts()
      setContracts(data)
    } catch (error: any) {
      console.error("[v0] Error loading contracts:", error)
      if (
        error?.message?.includes("Could not find the table") ||
        error?.message?.includes("relation") ||
        error?.message?.includes("does not exist")
      ) {
        setDbError(true)
      } else {
        toast({
          title: "Erro ao carregar contratos",
          description: "Não foi possível carregar a lista de contratos.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = async () => {
    try {
      setIsLoading(true)
      const filters: any = {}

      if (searchTerm) {
        filters.condominio = searchTerm
      }

      if (statusFilter !== "all") {
        filters.status = statusFilter
      }

      const data = await filterContracts(filters)
      setContracts(data)
    } catch (error) {
      console.error("[v0] Error filtering contracts:", error)
      toast({
        title: "Erro ao filtrar",
        description: "Não foi possível aplicar os filtros.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    loadContracts()
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
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (dbError) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Banco de dados não configurado</h3>
          <p className="text-sm text-muted-foreground mb-4">A tabela de contratos ainda não foi criada no Supabase.</p>
          <div className="mx-auto max-w-md rounded-lg bg-muted p-4 text-left text-sm">
            <p className="mb-2 font-medium">Para configurar o banco de dados:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Clique no botão "Run Script" abaixo</li>
              <li>
                Selecione o script <code className="rounded bg-background px-1">001-create-contracts-table.sql</code>
              </li>
              <li>Execute o script para criar a tabela</li>
              <li>Recarregue esta página</li>
            </ol>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={loadContracts} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (isLoading && contracts.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando contratos...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Buscar por condomínio</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Digite o nome do condomínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="generated">Gerado</SelectItem>
                <SelectItem value="signed">Assinado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFilter} className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {contracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Nenhum contrato encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece criando seu primeiro contrato</p>
            <Link href="/dashboard/new">
              <Button>Criar Contrato</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condomínio</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.condominio}</TableCell>
                  <TableCell>{contract.empresa || "-"}</TableCell>
                  <TableCell>{formatCurrency(contract.valor)}</TableCell>
                  <TableCell>{formatDate(contract.data_assinatura)}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/contracts/${contract.id}`}>
                        <Button variant="ghost" size="icon" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {contract.pdf_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download PDF"
                          onClick={() => window.open(contract.pdf_url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
