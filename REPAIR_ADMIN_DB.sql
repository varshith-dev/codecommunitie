-- FIX 1: Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- FIX 2: Add order_index to tags if missing
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- FIX 3: Initialize order_index
UPDATE public.tags SET order_index = id WHERE order_index IS NULL OR order_index = 0;

-- FIX 4: Ensure RLS is OFF for admin ease (or fix policies)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;

-- FIX 5: Create/Replace function for sorting tags
CREATE OR REPLACE FUNCTION update_tag_order(tag_updates jsonb)
RETURNS void AS $$
DECLARE 
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(tag_updates)
    LOOP
        UPDATE public.tags 
        SET order_index = (item->>'order_index')::int
        WHERE id = (item->>'id')::int;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
