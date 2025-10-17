# Livo Contract Backend

Backend microservice para o Livo Contract Generator - Extração e geração de contratos em PDF.

## Funcionalidades

- **Extração de dados de PDF**: Analisa PDFs de propostas comerciais e extrai informações usando regex
- **Geração de contratos**: Cria PDFs profissionais de contratos usando templates EJS e Puppeteer
- **Upload automático**: Salva os PDFs gerados no Supabase Storage

## Tecnologias

- Node.js + Express
- Puppeteer (geração de PDF)
- pdf-parse (extração de texto)
- EJS (templates)
- Supabase Storage
- Multer (upload de arquivos)

## Instalação

1. Instale as dependências:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Configure as variáveis de ambiente:
\`\`\`bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase
\`\`\`

3. Crie o bucket no Supabase Storage:
   - Acesse seu projeto no Supabase
   - Vá em Storage > Create bucket
   - Nome: `contracts-pdfs`
   - Marque como público se quiser URLs públicas

## Uso

### Desenvolvimento
\`\`\`bash
npm run dev
\`\`\`

### Produção
\`\`\`bash
npm start
\`\`\`

O servidor iniciará na porta 3001 (ou a porta definida em PORT).

## Endpoints

### POST /api/extract
Extrai dados de um PDF de proposta comercial.

**Request:**
- Content-Type: `multipart/form-data`
- Body: arquivo PDF no campo `pdf`

**Response:**
\`\`\`json
{
  "empresa": "Nome da Empresa",
  "cnpj_empresa": "12.345.678/0001-90",
  "condominio": "Nome do Condomínio",
  "cnpj_condominio": "98.765.432/0001-10",
  "valor": "5.000,00",
  "data_assinatura": "2024-01-15"
}
\`\`\`

### POST /api/generate
Gera um PDF de contrato e faz upload para o Supabase Storage.

**Request:**
\`\`\`json
{
  "empresa": "Nome da Empresa",
  "cnpj_empresa": "12.345.678/0001-90",
  "condominio": "Nome do Condomínio",
  "cnpj_condominio": "98.765.432/0001-10",
  "valor": "5.000,00",
  "data_assinatura": "2024-01-15"
}
\`\`\`

**Response:**
\`\`\`json
{
  "pdf_url": "https://seu-projeto.supabase.co/storage/v1/object/public/contracts-pdfs/contract-123456.pdf",
  "message": "Contrato gerado com sucesso"
}
\`\`\`

### GET /health
Health check do serviço.

**Response:**
\`\`\`json
{
  "status": "ok",
  "service": "Livo Contract Backend"
}
\`\`\`

## Integração com o Frontend

No frontend Next.js, atualize a variável de ambiente:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

O frontend já está configurado para usar esses endpoints através do módulo `lib/api/contracts-api.ts`.

## Estrutura de Arquivos

\`\`\`
backend/
├── server.js              # Servidor Express principal
├── templates/
│   └── contract_template.ejs  # Template do contrato
├── package.json
├── .env.example
└── README.md
\`\`\`

## Notas de Produção

Para deploy em produção:

1. Configure as variáveis de ambiente no seu serviço de hosting
2. Certifique-se de que o Puppeteer está configurado corretamente (pode precisar de flags adicionais em alguns ambientes)
3. Configure CORS adequadamente para permitir apenas seu domínio frontend
4. Use HTTPS em produção
5. Configure rate limiting para os endpoints

## Troubleshooting

**Puppeteer não funciona:**
- Em alguns ambientes (Docker, serverless), pode ser necessário instalar dependências adicionais
- Use a flag `--no-sandbox` (já configurada)

**Erro de upload no Supabase:**
- Verifique se o bucket existe e está configurado corretamente
- Confirme que as credenciais estão corretas
- Verifique as políticas de acesso do bucket

**Extração de dados imprecisa:**
- Os regex podem precisar de ajustes dependendo do formato dos PDFs
- Edite a função `extractDataFromText()` em `server.js` para melhorar a precisão
