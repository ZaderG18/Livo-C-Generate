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

DROP POLICY IF EXISTS "Allow authenticated users to read contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated users to update contracts" ON contracts;

CREATE POLICY "Allow authenticated users to read contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert contracts"
  ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (true);
