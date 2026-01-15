-- Add ad_credits to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ad_credits NUMERIC DEFAULT 0;

-- Create ad_credit_requests table
CREATE TABLE IF NOT EXISTS public.ad_credit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for ad_credit_requests
ALTER TABLE public.ad_credit_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Advertisers can view their own requests
CREATE POLICY "Advertisers can view own requests" 
ON public.ad_credit_requests 
FOR SELECT 
USING (auth.uid() = advertiser_id);

-- Policy: Advertisers can insert requests
CREATE POLICY "Advertisers can insert requests" 
ON public.ad_credit_requests 
FOR INSERT 
WITH CHECK (auth.uid() = advertiser_id);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all requests" 
ON public.ad_credit_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Policy: Admins can update requests
CREATE POLICY "Admins can update requests" 
ON public.ad_credit_requests 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RPC to safely approve credit request and add balance
CREATE OR REPLACE FUNCTION approve_ad_credit_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_amount NUMERIC;
    v_advertiser_id UUID;
    v_status TEXT;
BEGIN
    -- Get request details
    SELECT amount, advertiser_id, status 
    INTO v_amount, v_advertiser_id, v_status
    FROM public.ad_credit_requests 
    WHERE id = request_id;

    -- Checks
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Request is already processing or processed';
    END IF;

    -- Update request status
    UPDATE public.ad_credit_requests 
    SET status = 'approved', updated_at = NOW() 
    WHERE id = request_id;

    -- Add credits to advertiser profile
    UPDATE public.profiles 
    SET ad_credits = COALESCE(ad_credits, 0) + v_amount 
    WHERE id = v_advertiser_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
