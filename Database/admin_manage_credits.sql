-- Function to allow admins to add credits to a user
-- This should be called by the admin dashboard

CREATE OR REPLACE FUNCTION admin_add_credits(
    target_user_id UUID,
    amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS if needed, ensuring admins can update any profile
SET search_path = public
AS $$
BEGIN
    -- Input validation
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Update the user's credits
    UPDATE profiles
    SET ad_credits = COALESCE(ad_credits, 0) + amount
    WHERE id = target_user_id;

    -- Optional: Log this transaction (if we had a transactions table, which we might want later)
    -- INSERT INTO ad_credit_transactions ...

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$;
