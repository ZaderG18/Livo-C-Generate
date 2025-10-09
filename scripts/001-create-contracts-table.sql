-- Create contracts table for Livo Contract Generator
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio TEXT NOT NULL,
  cnpj_condominio TEXT NOT NULL,
  empresa TEXT,
  cnpj_empresa TEXT,
  valor TEXT NOT NULL,
  data_assinatura TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_condominio ON contracts(condominio);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all contracts
CREATE POLICY "Allow authenticated users to read contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert contracts
CREATE POLICY "Allow authenticated users to insert contracts"
  ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update contracts
CREATE POLICY "Allow authenticated users to update contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (true);
