-- Simplify club_category to 4 primary categories: Long Game, Short Game, Putting, Coach's Advice.
-- Run after 20250306120000_fault_cure_relational_schema.sql.

-- Create new enum
CREATE TYPE club_category_new AS ENUM ('long_game', 'short_game', 'putting', 'coach_advice');

-- Add new column, backfill from existing club and entry_type
ALTER TABLE entries ADD COLUMN club_new club_category_new;

UPDATE entries SET club_new = CASE
  WHEN club::text IN ('driver', 'woods', 'long-irons') THEN 'long_game'::club_category_new
  WHEN club::text IN ('short-irons', 'wedges', 'setup', 'anything') THEN 'short_game'::club_category_new
  WHEN club::text = 'putter' THEN 'putting'::club_category_new
  WHEN entry_type::text = 'coach-advice' THEN 'coach_advice'::club_category_new
  ELSE 'long_game'::club_category_new
END;

-- Replace old column
ALTER TABLE entries DROP COLUMN club;
ALTER TABLE entries RENAME COLUMN club_new TO club;
ALTER TABLE entries ALTER COLUMN club SET NOT NULL;

-- Swap enum types: drop old, rename new
DROP TYPE club_category;
ALTER TYPE club_category_new RENAME TO club_category;
