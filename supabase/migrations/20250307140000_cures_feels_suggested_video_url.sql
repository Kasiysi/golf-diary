-- AI Coach: store Gemini-suggested YouTube tutorial link per cure/feel.
-- Works for all categories (Long Game, Short Game, Putting, Coach's Advice).

ALTER TABLE cures_feels
ADD COLUMN IF NOT EXISTS suggested_video_url TEXT;

COMMENT ON COLUMN cures_feels.suggested_video_url IS 'AI-suggested YouTube tutorial URL (direct video or search); from Gemini when analyzing Finnish notes.';
