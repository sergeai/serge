-- ============================================================================
-- AI Audit Analysis - Complete Database Setup
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE (Enhanced)
-- ============================================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'enterprise')),
    audits_used_this_month INTEGER DEFAULT 0,
    audit_credits INTEGER DEFAULT 10,
    monthly_reset_date TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW') + INTERVAL '1 month'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'enterprise')),
ADD COLUMN IF NOT EXISTS audits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS audit_credits INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS monthly_reset_date TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month');

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS profiles_monthly_reset_date_idx ON public.profiles(monthly_reset_date);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_type_idx ON public.subscriptions(plan_type);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;

-- Create policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 3. AUDITS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_email TEXT NOT NULL,
    domain TEXT,
    website_url TEXT,
    analysis_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    results JSONB,
    report_html TEXT,
    error_message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS audits_user_id_idx ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS audits_domain_idx ON public.audits(domain);
CREATE INDEX IF NOT EXISTS audits_business_email_idx ON public.audits(business_email);
CREATE INDEX IF NOT EXISTS audits_status_idx ON public.audits(status);
CREATE INDEX IF NOT EXISTS audits_overall_score_idx ON public.audits(overall_score);
CREATE INDEX IF NOT EXISTS audits_completed_at_idx ON public.audits(completed_at);
CREATE INDEX IF NOT EXISTS audits_created_at_idx ON public.audits(created_at);

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can create their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can update their own audits" ON public.audits;
DROP POLICY IF EXISTS "Service role can manage all audits" ON public.audits;

-- Create policies
CREATE POLICY "Users can view their own audits" ON public.audits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audits" ON public.audits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audits" ON public.audits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all audits" ON public.audits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4. AUDIT PARAMETERS TABLE (For storing individual parameter scores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_parameters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
    parameter_name TEXT NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    insights TEXT[],
    recommendations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS audit_parameters_audit_id_idx ON public.audit_parameters(audit_id);
CREATE INDEX IF NOT EXISTS audit_parameters_parameter_name_idx ON public.audit_parameters(parameter_name);
CREATE INDEX IF NOT EXISTS audit_parameters_score_idx ON public.audit_parameters(score);

-- Enable RLS
ALTER TABLE public.audit_parameters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own audit parameters" ON public.audit_parameters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.audits 
            WHERE audits.id = audit_parameters.audit_id 
            AND audits.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all audit parameters" ON public.audit_parameters
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 5. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS audits_updated_at ON public.audits;
CREATE TRIGGER audits_updated_at
    BEFORE UPDATE ON public.audits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to reset monthly audit counts
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

-- Function to get user's audit limits based on subscription
CREATE OR REPLACE FUNCTION public.get_user_audit_limit(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_tier TEXT;
    audit_limit INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM public.profiles
    WHERE id = user_uuid;
    
    -- Set limits based on tier
    CASE user_tier
        WHEN 'free' THEN audit_limit := 10;
        WHEN 'basic' THEN audit_limit := 50;
        WHEN 'enterprise' THEN audit_limit := -1; -- Unlimited
        ELSE audit_limit := 10; -- Default to free
    END CASE;
    
    RETURN audit_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can run audit
CREATE OR REPLACE FUNCTION public.can_user_run_audit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_limit INTEGER;
    audits_used INTEGER;
BEGIN
    -- Get user's audit limit
    SELECT public.get_user_audit_limit(user_uuid) INTO user_limit;
    
    -- If unlimited, return true
    IF user_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Get current usage
    SELECT audits_used_this_month INTO audits_used
    FROM public.profiles
    WHERE id = user_uuid;
    
    -- Check if under limit
    RETURN (audits_used < user_limit);
END;
$$ LANGUAGE plpgsql;

-- Function to increment audit usage
CREATE OR REPLACE FUNCTION public.increment_audit_usage(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET audits_used_this_month = audits_used_this_month + 1
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to sync subscription with profile
CREATE OR REPLACE FUNCTION public.sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile subscription tier when subscription changes
    UPDATE public.profiles
    SET subscription_tier = NEW.plan_type
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync subscription changes to profile
DROP TRIGGER IF EXISTS sync_subscription_to_profile ON public.subscriptions;
CREATE TRIGGER sync_subscription_to_profile
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_subscription_to_profile();

-- ============================================================================
-- 6. VIEWS FOR ANALYTICS
-- ============================================================================

-- View for audit analytics
CREATE OR REPLACE VIEW public.audit_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as audit_date,
    COUNT(*) as total_audits,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_audits,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_audits,
    AVG(overall_score) FILTER (WHERE status = 'completed') as avg_score,
    COUNT(DISTINCT user_id) as unique_users
FROM public.audits
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY audit_date DESC;

-- View for subscription analytics
CREATE OR REPLACE VIEW public.subscription_analytics AS
SELECT 
    plan_type,
    status,
    COUNT(*) as subscription_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM public.subscriptions
GROUP BY plan_type, status
ORDER BY plan_type, status;

-- ============================================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Note: Sample data removed to avoid foreign key constraint errors
-- Audit parameters will be created automatically when audits are processed

-- ============================================================================
-- 8. GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'subscriptions', 'audits', 'audit_parameters')
ORDER BY tablename;
