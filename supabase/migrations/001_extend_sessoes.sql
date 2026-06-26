-- ============================================================
-- Migração 001: Estende tabela sessoes com metadados de estudo
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

ALTER TABLE sessoes
  ADD COLUMN IF NOT EXISTS assunto  text,
  ADD COLUMN IF NOT EXISTS tipo     text DEFAULT 'teoria',
  ADD COLUMN IF NOT EXISTS notas    text;

-- Índice para consultas analíticas por tipo de estudo
CREATE INDEX IF NOT EXISTS idx_sessoes_tipo ON sessoes(tipo);
CREATE INDEX IF NOT EXISTS idx_sessoes_assunto ON sessoes(assunto);
