-- Add order_index column for manual sorting
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Initialize order_index with id to have a stable default sort
UPDATE public.tags SET order_index = id WHERE order_index IS NULL OR order_index = 0;

-- Create function to bulk update tag order (optional, but good for RPC)
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
