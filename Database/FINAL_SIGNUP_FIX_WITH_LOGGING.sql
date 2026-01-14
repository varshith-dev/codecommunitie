-- FINAL SIGNUP FIX WITH LOGGING 🔍
-- This will help us debug exactly what's failing

-- Step 1: Ensure profiles table has ALL required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Add foreign key if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Drop ALL old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_old ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Step 4: Drop old functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_v3() CASCADE;

-- Step 5: Create ROBUST function with detailed error logging
CREATE OR REPLACE FUNCTION public.handle_new_user_signup() 
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  attempt_count int := 0;
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Trigger fired for user: %', new.id;
  
  -- Check if profile already exists (idempotency)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    RAISE NOTICE 'Profile already exists for user: %', new.id;
    RETURN new;
  END IF;

  -- Extract username from metadata or email
  base_username := COALESCE(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name', 
    split_part(new.email, '@', 1)
  );
  
  RAISE NOTICE 'Base username: %', base_username;
  
  final_username := base_username;

  -- Try inserting with base username
  BEGIN
    INSERT INTO public.profiles (
      id, 
      username, 
      full_name, 
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      new.id,
      final_username,
      COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'display_name',
        base_username
      ),
      new.raw_user_meta_data->>'avatar_url',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Successfully created profile for user: % with username: %', new.id, final_username;
    RETURN new;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Username collision - try with random suffix
      RAISE NOTICE 'Username collision detected for: %', final_username;
      
      FOR attempt_count IN 1..5 LOOP
        final_username := base_username || '_' || floor(random() * 10000)::text;
        
        BEGIN
          INSERT INTO public.profiles (
            id, 
            username, 
            full_name, 
            avatar_url,
            created_at,
            updated_at
          ) VALUES (
            new.id,
            final_username,
            COALESCE(
              new.raw_user_meta_data->>'full_name',
              new.raw_user_meta_data->>'display_name',
              base_username
            ),
            new.raw_user_meta_data->>'avatar_url',
            NOW(),
            NOW()
          );
          
          RAISE NOTICE 'Created profile with collision-resolved username: %', final_username;
          RETURN new;
          
        EXCEPTION WHEN unique_violation THEN
          RAISE NOTICE 'Attempt % failed, retrying...', attempt_count;
          CONTINUE;
        END;
      END LOOP;
      
      -- Final fallback: use UUID
      final_username := 'user_' || substr(new.id::text, 1, 8);
      
      INSERT INTO public.profiles (
        id, 
        username, 
        full_name, 
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        new.id,
        final_username,
        'New User',
        '',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created profile with UUID fallback username: %', final_username;
      RETURN new;
      
    WHEN OTHERS THEN
      -- Log any other error
      RAISE WARNING 'Error creating profile for user %: % - %', new.id, SQLERRM, SQLSTATE;
      -- Re-raise the error so signup fails visibly
      RAISE;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 6: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Step 7: Set proper permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

-- Step 8: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true); -- Allow trigger to insert

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" 
  ON public.profiles FOR DELETE 
  USING (auth.uid() = id);

-- Step 10: Verify setup
SELECT 'Setup Complete! ✅' as status;

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';
