-- Entry-to-entry links (e.g. Problem -> Drill). Used by Detail View "Link to another entry".
CREATE TABLE IF NOT EXISTS entry_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL,
  linked_entry_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entry_id, linked_entry_id),
  CHECK (entry_id != linked_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_connections_entry_id ON entry_connections(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_connections_linked_entry_id ON entry_connections(linked_entry_id);

COMMENT ON TABLE entry_connections IS 'Links between diary entries (e.g. Problem -> Drill).';
