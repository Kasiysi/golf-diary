-- Use instruction / instruction_english from cures_feels (content/content_english removed).
-- Redefine RPCs so semantic search and API keep working with same response shape.

CREATE OR REPLACE FUNCTION match_cures_by_query(
  query_embedding vector(1536),
  p_user_id UUID,
  match_limit INT DEFAULT 5
)
RETURNS TABLE (
  cure_id UUID,
  cure_content TEXT,
  cure_content_english TEXT,
  cure_type entry_type,
  fault_id UUID,
  fault_description TEXT,
  fault_description_english TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH fault_matches AS (
    SELECT
      f.id AS fault_id,
      f.description AS fault_description,
      f.description_english AS fault_description_english,
      1 - (f.embedding <=> query_embedding) AS sim
    FROM faults f
    WHERE f.user_id = p_user_id
      AND f.embedding IS NOT NULL
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_limit * 2
  ),
  linked AS (
    SELECT
      cf.id AS cure_id,
      cf.instruction AS cure_content,
      cf.instruction_english AS cure_content_english,
      cf.type AS cure_type,
      fm.fault_id,
      fm.fault_description,
      fm.fault_description_english,
      fm.sim AS similarity
    FROM fault_cure_links fcl
    JOIN cures_feels cf ON cf.id = fcl.cure_id AND cf.user_id = p_user_id
    JOIN fault_matches fm ON fm.fault_id = fcl.fault_id
  )
  SELECT
    linked.cure_id,
    linked.cure_content,
    linked.cure_content_english,
    linked.cure_type,
    linked.fault_id,
    linked.fault_description,
    linked.fault_description_english,
    linked.similarity
  FROM linked
  ORDER BY linked.similarity DESC
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION match_cures_direct(
  query_embedding vector(1536),
  p_user_id UUID,
  match_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  content_english TEXT,
  type entry_type,
  is_priority BOOLEAN,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id,
    cf.instruction AS content,
    cf.instruction_english AS content_english,
    cf.type,
    cf.is_priority,
    (1 - (cf.embedding <=> query_embedding))::FLOAT AS similarity
  FROM cures_feels cf
  WHERE cf.user_id = p_user_id
    AND cf.embedding IS NOT NULL
  ORDER BY cf.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql STABLE;
