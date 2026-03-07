-- Optional category for dashboard: Long Game, Short Game, Putting, Coach's Advice (stored as long-game, short-game, putting, coach-advice).
ALTER TABLE cures_feels
ADD COLUMN IF NOT EXISTS club TEXT;

COMMENT ON COLUMN cures_feels.club IS 'Category for display: long-game, short-game, putting, coach-advice.';
