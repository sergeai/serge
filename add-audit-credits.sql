-- Add audit_credits column to profiles table if it doesn't exist
-- Run this if you already have the profiles table created

DO $$ 
BEGIN
    -- Check if audit_credits column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'audit_credits'
        AND table_schema = 'public'
    ) THEN
        -- Add audit_credits column
        ALTER TABLE public.profiles 
        ADD COLUMN audit_credits INTEGER DEFAULT 10;
        
        -- Set initial credits based on subscription tier
        UPDATE public.profiles 
        SET audit_credits = CASE 
            WHEN subscription_tier = 'basic' THEN 50
            WHEN subscription_tier = 'enterprise' THEN 999999
            ELSE 10
        END;
        
        RAISE NOTICE 'Added audit_credits column and set initial values';
    ELSE
        RAISE NOTICE 'audit_credits column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'audit_credits';
