# Deploy Supabase Edge Function for Stripe Webhook Processing
# Make sure you have Supabase CLI installed: https://supabase.com/docs/guides/cli

Write-Host "Deploying Supabase Edge Function for Stripe webhook processing..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "Supabase CLI version: $supabaseVersion" -ForegroundColor Blue
} catch {
    Write-Host "Error: Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://supabase.com/docs/guides/cli/getting-started#installing-the-supabase-cli" -ForegroundColor Yellow
    exit 1
}

# Login to Supabase (if not already logged in)
Write-Host "Logging in to Supabase..." -ForegroundColor Blue
supabase login

# Link to your project
Write-Host "Linking to your Supabase project..." -ForegroundColor Blue
Write-Host "Please enter your Supabase project reference ID (found in your project settings):" -ForegroundColor Yellow
$projectRef = Read-Host "Project Reference ID"

if ($projectRef) {
    supabase link --project-ref $projectRef
} else {
    Write-Host "Error: Project reference ID is required" -ForegroundColor Red
    exit 1
}

# Set environment variables for the Edge Function
Write-Host "Setting up environment variables..." -ForegroundColor Blue

# Read environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            
            # Set relevant environment variables for the Edge Function
            if ($name -in @("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_URL")) {
                Write-Host "Setting $name..." -ForegroundColor Gray
                supabase secrets set $name=$value
            }
        }
    }
} else {
    Write-Host "Warning: .env file not found. Please set environment variables manually:" -ForegroundColor Yellow
    Write-Host "supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key" -ForegroundColor Gray
    Write-Host "supabase secrets set STRIPE_WEBHOOK_SECRET=your_webhook_secret" -ForegroundColor Gray
    Write-Host "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" -ForegroundColor Gray
    Write-Host "supabase secrets set SUPABASE_URL=your_supabase_url" -ForegroundColor Gray
}

# Deploy the Edge Function
Write-Host "Deploying the activate-subscription Edge Function..." -ForegroundColor Blue
supabase functions deploy activate-subscription

# Verify deployment
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your Stripe webhook endpoint to:" -ForegroundColor White
Write-Host "   https://your-project-ref.supabase.co/functions/v1/activate-subscription" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Or keep using your current endpoint which will forward to the Edge Function:" -ForegroundColor White
Write-Host "   https://your-domain.com/api/stripe/webhook" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test the webhook by making a test payment in Stripe" -ForegroundColor White
Write-Host ""
Write-Host "4. Monitor function logs with:" -ForegroundColor White
Write-Host "   supabase functions logs activate-subscription" -ForegroundColor Cyan
