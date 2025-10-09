"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Sparkles } from "lucide-react"

interface ContractFormProps {
  onGenerate: (data: ContractData) => void
}

export interface ContractData {
  contractType: string
  partyA: string
  partyADocument: string
  partyB: string
  partyBDocument: string
  object: string
  value: string
  startDate: string
  endDate: string
  additionalTerms: string
}

export function ContractForm({ onGenerate }: ContractFormProps) {
  const [formData, setFormData] = useState<ContractData>({
    contractType: "",
    partyA: "",
    partyADocument: "",
    partyB: "",
    partyBDocument: "",
    object: "",
    value: "",
    startDate: "",
    endDate: "",
    additionalTerms: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate(formData)
  }

  const handleChange = (field: keyof ContractData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Novo Contrato</CardTitle>
            <CardDescription>Preencha os dados para gerar seu contrato</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contractType">Tipo de Contrato</Label>
            <Input
              id="contractType"
              placeholder="Ex: Prestação de Serviços, Compra e Venda..."
              value={formData.contractType}
              onChange={(e) => handleChange("contractType", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">Contratante</h3>
              <div className="space-y-2">
                <Label htmlFor="partyA">Nome/Razão Social</Label>
                <Input
                  id="partyA"
                  placeholder="Nome completo ou empresa"
                  value={formData.partyA}
                  onChange={(e) => handleChange("partyA", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyADocument">CPF/CNPJ</Label>
                <Input
                  id="partyADocument"
                  placeholder="000.000.000-00"
                  value={formData.partyADocument}
                  onChange={(e) => handleChange("partyADocument", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">Contratado</h3>
              <div className="space-y-2">
                <Label htmlFor="partyB">Nome/Razão Social</Label>
                <Input
                  id="partyB"
                  placeholder="Nome completo ou empresa"
                  value={formData.partyB}
                  onChange={(e) => handleChange("partyB", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyBDocument">CPF/CNPJ</Label>
                <Input
                  id="partyBDocument"
                  placeholder="000.000.000-00"
                  value={formData.partyBDocument}
                  onChange={(e) => handleChange("partyBDocument", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="object">Objeto do Contrato</Label>
            <Input
              id="object"
              placeholder="Descreva o objeto do contrato"
              value={formData.object}
              onChange={(e) => handleChange("object", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="text"
                placeholder="0,00"
                value={formData.value}
                onChange={(e) => handleChange("value", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalTerms">Cláusulas Adicionais (Opcional)</Label>
            <textarea
              id="additionalTerms"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Adicione cláusulas específicas ou observações..."
              value={formData.additionalTerms}
              onChange={(e) => handleChange("additionalTerms", e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            <Sparkles className="mr-2 h-5 w-5" />
            Gerar Contrato
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
