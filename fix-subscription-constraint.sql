-- Fix subscription table constraint for upsert operations
-- Run this if you already have the subscriptions table created

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_user_id_key'
    ) THEN
        -- Add unique constraint on user_id
        ALTER TABLE public.subscriptions 
        ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
        
        RAISE NOTICE 'Added unique constraint on user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on user_id already exists';
    END IF;
END $$;

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.subscriptions'::regclass
AND conname = 'subscriptions_user_id_key';
