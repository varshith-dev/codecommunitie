-- Update trigger_type constraint to allow new events
ALTER TABLE public.prompt_automations 
DROP CONSTRAINT prompt_automations_trigger_type_check;

ALTER TABLE public.prompt_automations 
ADD CONSTRAINT prompt_automations_trigger_type_check 
CHECK (trigger_type IN ('new_user', 'manual', 'time_based', 'login', 'create_post', 'incomplete_profile'));
