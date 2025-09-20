-- Update audits table to match new structure
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS overall_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS results JSONB,
ADD COLUMN IF NOT EXISTS report_html TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update existing columns if they exist
ALTER TABLE public.audits 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN analysis_types TYPE TEXT[] USING CASE 
    WHEN analysis_types IS NULL THEN ARRAY[]::TEXT[]
    ELSE analysis_types::TEXT[]
END;

-- Add check constraint for status
ALTER TABLE public.audits 
DROP CONSTRAINT IF EXISTS audits_status_check,
ADD CONSTRAINT audits_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS audits_domain_idx ON public.audits(domain);
CREATE INDEX IF NOT EXISTS audits_status_idx ON public.audits(status);
CREATE INDEX IF NOT EXISTS audits_overall_score_idx ON public.audits(overall_score);
CREATE INDEX IF NOT EXISTS audits_completed_at_idx ON public.audits(completed_at);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can create their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can update their own audits" ON public.audits;

CREATE POLICY "Users can view their own audits" ON public.audits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audits" ON public.audits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audits" ON public.audits
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for API endpoints)
CREATE POLICY "Service role can manage all audits" ON public.audits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
