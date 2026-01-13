-- Create a table to track all emails sent via our custom system
create table public.email_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  recipient_email text not null,
  subject text not null,
  status text check (status in ('sent', 'failed')) default 'sent',
  template_type text, -- 'WELCOME', 'OTP', 'CUSTOM', etc.
  triggered_by text, -- 'admin', 'automation'
  error_message text
);

-- Enable RLS
alter table public.email_logs enable row level security;

-- Allow admins to view logs (assuming admins have a specific role, or public for this dev environment)
-- For this "Playground" environment with your current setup, we'll allow authenticated users to read/insert
create policy "Allow internal read access" on public.email_logs for select using (true);
create policy "Allow internal insert access" on public.email_logs for insert with check (true);
