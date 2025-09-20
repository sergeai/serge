-- Update profiles table to include subscription info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'enterprise')),
ADD COLUMN IF NOT EXISTS audits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reset_date TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month');

-- Create function to reset monthly audit counts
CREATE OR REPLACE FUNCTION public.reset_monthly_audits()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        audits_used_this_month = 0,
        monthly_reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE monthly_reset_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to reset audit counts monthly (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('reset-monthly-audits', '0 0 1 * *', 'SELECT public.reset_monthly_audits();');
