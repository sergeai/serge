-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  subscription_plan text check (subscription_plan in ('starter', 'professional', 'enterprise')) default 'starter',
  audit_credits integer default 2
);

-- Create audits table
create table public.audits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  business_email text not null,
  website_url text,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  ai_readiness_score integer check (ai_readiness_score >= 0 and ai_readiness_score <= 100),
  analysis_types text[] not null,
  results jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Create subscriptions table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text check (plan in ('starter', 'professional', 'enterprise')) not null,
  status text check (status in ('active', 'cancelled', 'past_due')) default 'active',
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.audits enable row level security;
alter table public.subscriptions enable row level security;

-- Create policies for profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Create policies for audits
create policy "Users can view own audits" on public.audits
  for select using (auth.uid() = user_id);

create policy "Users can insert own audits" on public.audits
  for insert with check (auth.uid() = user_id);

create policy "Users can update own audits" on public.audits
  for update using (auth.uid() = user_id);

-- Create policies for subscriptions
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can insert own subscriptions" on public.subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own subscriptions" on public.subscriptions
  for update using (auth.uid() = user_id);

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.audits
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index idx_audits_user_id on public.audits(user_id);
create index idx_audits_created_at on public.audits(created_at desc);
create index idx_audits_status on public.audits(status);
create index idx_subscriptions_user_id on public.subscriptions(user_id);

-- Insert sample data (optional - for development)
-- Note: This will only work after you have actual users in auth.users table
/*
-- Sample profiles (replace with actual user IDs from auth.users)
insert into public.profiles (id, email, full_name, subscription_plan, audit_credits) values
  ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User', 'professional', 10),
  ('00000000-0000-0000-0000-000000000002', 'test@example.com', 'Test User', 'starter', 2);

-- Sample audits
insert into public.audits (user_id, business_email, website_url, status, ai_readiness_score, analysis_types, results) values
  ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'https://example.com', 'completed', 85, 
   array['website_analysis', 'social_media', 'operations'], 
   '{"score": 85, "recommendations": ["Implement AI chatbot", "Automate data entry", "Use AI for personalization"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'test@company.com', 'https://company.com', 'processing', null, 
   array['website_analysis', 'competitors', 'data_readiness'], null);
*/
