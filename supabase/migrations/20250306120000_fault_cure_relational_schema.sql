-- Fault-Cure Relational Schema + Multilingual + pgvector
-- Run this migration in Supabase SQL Editor or via Supabase CLI.
-- Prerequisite: Supabase project with Auth enabled (auth.users exists).

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums aligned with app (lib/types.ts)
CREATE TYPE club_category AS ENUM (
  'driver', 'woods', 'long-irons', 'short-irons', 'wedges', 'putter', 'setup', 'anything'
);

CREATE TYPE swing_phase AS ENUM ('none', 'setup', 'backswing', 'downswing');

CREATE TYPE entry_type AS ENUM ('feel', 'problem', 'drill', 'coach-advice');

CREATE TYPE content_language AS ENUM ('fi', 'en');

-- Media item (stored as JSONB in entries; shape matches MediaItem in types.ts)
-- No separate table needed unless you want to normalize later.

-- =============================================================================
-- ENTRIES (evolved from flat DiaryEntry)
-- =============================================================================
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club club_category NOT NULL,
  entry_type entry_type NOT NULL,
  swing_phase swing_phase DEFAULT 'none',
  notes TEXT NOT NULL DEFAULT '',
  problem_notes TEXT,
  cure TEXT,
  youtube_link TEXT,
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority BOOLEAN NOT NULL DEFAULT false,
  language content_language NOT NULL DEFAULT 'en',
  -- AI-generated English summary/tags for Finnish content; used for vector search
  search_summary_english TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- pgvector: 1536 dimensions for OpenAI text-embedding-3-small (or match your embed model)
  embedding vector(1536)
);

CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX idx_entries_club ON entries(club);
CREATE INDEX idx_entries_entry_type ON entries(entry_type);
CREATE INDEX idx_entries_priority ON entries(user_id, priority) WHERE priority = true;
-- Vector similarity search (use when querying by embedding)
CREATE INDEX idx_entries_embedding ON entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON COLUMN entries.search_summary_english IS 'English summary/tags for Finnish entries; enables cross-language semantic search';

-- =============================================================================
-- FAULTS (problems, normalized for linking to cures)
-- =============================================================================
CREATE TABLE faults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  description_english TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding vector(1536)
);

CREATE INDEX idx_faults_user_id ON faults(user_id);
CREATE INDEX idx_faults_entry_id ON faults(entry_id);
CREATE INDEX idx_faults_embedding ON faults USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- CURES_FEELS (fixes, feels, drills, coach-advice; Checklist = is_priority)
-- =============================================================================
CREATE TABLE cures_feels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  type entry_type NOT NULL,
  content TEXT NOT NULL,
  content_english TEXT,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding vector(1536)
);

CREATE INDEX idx_cures_feels_user_id ON cures_feels(user_id);
CREATE INDEX idx_cures_feels_entry_id ON cures_feels(entry_id);
CREATE INDEX idx_cures_feels_is_priority ON cures_feels(user_id, is_priority) WHERE is_priority = true;
CREATE INDEX idx_cures_feels_embedding ON cures_feels USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON COLUMN cures_feels.is_priority IS 'Drives Quick-Check Dashboard / Checklist: top priorities';

-- =============================================================================
-- FAULT_CURE_LINKS (many-to-many: which cure fixes which fault)
-- =============================================================================
CREATE TABLE fault_cure_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
  cure_id UUID NOT NULL REFERENCES cures_feels(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  UNIQUE(fault_id, cure_id)
);

CREATE INDEX idx_fault_cure_links_fault ON fault_cure_links(fault_id);
CREATE INDEX idx_fault_cure_links_cure ON fault_cure_links(cure_id);

-- =============================================================================
-- RLS (Row Level Security) placeholders – enable and add policies when using Supabase Auth
-- =============================================================================
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE cures_feels ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_cure_links ENABLE ROW LEVEL SECURITY;

-- Example policies (uncomment and use auth.uid() when Supabase Auth is wired):
-- CREATE POLICY "Users can CRUD own entries" ON entries FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can CRUD own faults" ON faults FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can CRUD own cures_feels" ON cures_feels FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can manage fault_cure_links for own data"
--   ON fault_cure_links FOR ALL
--   USING (
--     EXISTS (SELECT 1 FROM faults f WHERE f.id = fault_id AND f.user_id = auth.uid())
--   );
