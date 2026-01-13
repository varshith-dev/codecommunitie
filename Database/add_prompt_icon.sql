-- Add icon column to user_prompts table
ALTER TABLE user_prompts ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'bell';

-- Update existing prompts to have default icon
UPDATE user_prompts SET icon = 'bell' WHERE icon IS NULL;
