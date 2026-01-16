-- List all Triggers on profiles and auth.users
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_name,
    action_statement as trigger_definition
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'users', 'auth.users');

-- Check if user_prompts is a Table or View
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'user_prompts';

-- Check for any function that inserts into user_prompts
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_definition ILIKE '%INSERT INTO user_prompts%';

-- Check content of prompt_settings to see if "Get Verified" exists
SELECT * FROM prompt_settings;
