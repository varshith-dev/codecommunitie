-- Create a settings table for global ad configurations
CREATE TABLE IF NOT EXISTS ad_settings (
    id SERIAL PRIMARY KEY,
    cpc_rate NUMERIC DEFAULT 5.00,
    cpm_rate NUMERIC DEFAULT 2.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO ad_settings (id, cpc_rate, cpm_rate)
VALUES (1, 5.00, 2.00)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Read public, Write Admin Only)
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON ad_settings
    FOR SELECT USING (true); -- Everyone needs to see pricing

CREATE POLICY "Allow admin write access" ON ad_settings
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );
