ALTER TABLE questoes
  ADD COLUMN IF NOT EXISTS assunto text;

CREATE INDEX IF NOT EXISTS idx_questoes_assunto ON questoes(assunto);
