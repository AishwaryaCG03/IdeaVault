

-- This function is used to increment counters in tables
CREATE OR REPLACE FUNCTION public.increment_counter(
  row_id UUID,
  table_name TEXT,
  column_name TEXT
) RETURNS RECORD AS $$
DECLARE
  result RECORD;
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = %I + 1 WHERE id = $1 RETURNING *',
    table_name,
    column_name,
    column_name
  ) INTO result USING row_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

