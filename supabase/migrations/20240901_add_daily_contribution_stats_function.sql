
-- Create function to get daily contribution statistics
CREATE OR REPLACE FUNCTION public.get_daily_contribution_stats(
  network_param TEXT,
  from_date DATE,
  to_date DATE
)
RETURNS TABLE (
  date DATE,
  sol_amount NUMERIC,
  token_amount NUMERIC,
  count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH dates AS (
    SELECT generate_series(from_date, to_date, '1 day'::interval)::date AS date
  )
  SELECT
    dates.date,
    COALESCE(SUM(pc.sol_amount), 0) AS sol_amount,
    COALESCE(SUM(pc.token_amount), 0) AS token_amount,
    COALESCE(COUNT(pc.id), 0) AS count
  FROM
    dates
  LEFT JOIN
    presale_contributions pc ON 
      dates.date = date_trunc('day', pc.created_at)::date AND
      pc.network = network_param
  GROUP BY
    dates.date
  ORDER BY
    dates.date ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_daily_contribution_stats TO authenticated;
