
-- This function is used to increment counters in tables
CREATE OR REPLACE FUNCTION public.increment_counter(
  row_id UUID,
  table_name TEXT,
  column_name TEXT
) RETURNS SETOF RECORD AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = %I + 1 WHERE id = $1 RETURNING %I',
    table_name,
    column_name,
    column_name,
    column_name
  ) USING row_id;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
