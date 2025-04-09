
-- Create a function to insert premium subscription even when RLS might otherwise restrict it
CREATE OR REPLACE FUNCTION public.create_premium_subscription(
  p_user_id UUID,
  p_payment_tx_hash TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.premium_subscriptions (
    user_id,
    payment_tx_hash,
    payment_currency,
    payment_amount,
    expires_at
  ) VALUES (
    p_user_id,
    p_payment_tx_hash,
    'SOL',
    0,
    p_expires_at
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create premium subscription: %', SQLERRM;
    RETURN NULL;
END;
$$;
