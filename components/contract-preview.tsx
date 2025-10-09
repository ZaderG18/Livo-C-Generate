"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Printer } from "lucide-react"
import type { ContractData } from "./contract-form"

interface ContractPreviewProps {
  data: ContractData
}

export function ContractPreview({ data }: ContractPreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const element = document.getElementById("contract-content")
    if (!element) return

    const content = element.innerText
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contrato-${data.contractType.toLowerCase().replace(/\s+/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Visualização do Contrato</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div id="contract-content" className="space-y-6 rounded-lg bg-card p-8 text-sm leading-relaxed print:bg-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">{data.contractType}</h1>
          </div>

          <div className="space-y-4">
            <p className="text-justify">
              Pelo presente instrumento particular de contrato, de um lado <strong>{data.partyA}</strong>, inscrito(a)
              no CPF/CNPJ sob o nº <strong>{data.partyADocument}</strong>, doravante denominado(a){" "}
              <strong>CONTRATANTE</strong>, e de outro lado <strong>{data.partyB}</strong>, inscrito(a) no CPF/CNPJ sob
              o nº <strong>{data.partyBDocument}</strong>, doravante denominado(a) <strong>CONTRATADO(A)</strong>, têm
              entre si justo e contratado o seguinte:
            </p>

            <div>
              <h2 className="mb-2 font-bold text-primary">CLÁUSULA PRIMEIRA - DO OBJETO</h2>
              <p className="text-justify">
                O presente contrato tem como objeto: <strong>{data.object}</strong>.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-bold text-primary">CLÁUSULA SEGUNDA - DO VALOR</h2>
              <p className="text-justify">
                O CONTRATANTE pagará ao CONTRATADO(A) o valor total de <strong>R$ {data.value}</strong>, pelos serviços
                prestados conforme objeto deste contrato.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-bold text-primary">CLÁUSULA TERCEIRA - DO PRAZO</h2>
              <p className="text-justify">
                O presente contrato terá início em <strong>{formatDate(data.startDate)}</strong>
                {data.endDate && (
                  <>
                    {" "}
                    e término previsto para <strong>{formatDate(data.endDate)}</strong>
                  </>
                )}
                , podendo ser prorrogado mediante acordo entre as partes.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-bold text-primary">CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO CONTRATANTE</h2>
              <p className="text-justify">
                São obrigações do CONTRATANTE: fornecer todas as informações necessárias para a execução do objeto
                contratual e efetuar o pagamento conforme estabelecido neste instrumento.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-bold text-primary">CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO CONTRATADO</h2>
              <p className="text-justify">
                São obrigações do CONTRATADO(A): executar os serviços com qualidade e dentro dos prazos estabelecidos,
                mantendo sigilo sobre informações confidenciais.
              </p>
            </div>

            {data.additionalTerms && (
              <div>
                <h2 className="mb-2 font-bold text-primary">CLÁUSULA SEXTA - DISPOSIÇÕES GERAIS</h2>
                <p className="text-justify whitespace-pre-line">{data.additionalTerms}</p>
              </div>
            )}

            <div>
              <h2 className="mb-2 font-bold text-primary">CLÁUSULA FINAL - DO FORO</h2>
              <p className="text-justify">
                As partes elegem o foro da comarca de [CIDADE/ESTADO] para dirimir quaisquer dúvidas ou controvérsias
                oriundas do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-8">
            <p className="text-center">
              E por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor e
              forma.
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <div className="border-t border-foreground/20 pt-2 text-center">
                  <p className="font-semibold">{data.partyA}</p>
                  <p className="text-xs text-muted-foreground">CONTRATANTE</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="border-t border-foreground/20 pt-2 text-center">
                  <p className="font-semibold">{data.partyB}</p>
                  <p className="text-xs text-muted-foreground">CONTRATADO(A)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
