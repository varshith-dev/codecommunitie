-- FIX: Handle Username Collisions in Signup Trigger
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  -- Determine base username
  base_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  final_username := base_username;

  BEGIN
    -- Try to insert with the original username
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      new.id,
      final_username,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
      new.raw_user_meta_data->>'avatar_url'
    );
  EXCEPTION WHEN unique_violation THEN
     -- If username exists, append a random 4-char suffix
     final_username := base_username || '_' || substr(md5(random()::text), 1, 4);
     
     INSERT INTO public.profiles (id, username, full_name, avatar_url)
     VALUES (
      new.id,
      final_username,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
      new.raw_user_meta_data->>'avatar_url'
     )
     ON CONFLICT (id) DO NOTHING; -- If ID exists (unexpected), do nothing
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
