-- Migration: Add username and login_password fields to profiles for barbershop login

-- Add username field for login
alter table public.profiles 
  add column if not exists username text,
  add column if not exists login_password text;

-- Create index on username for fast lookup
create index if not exists idx_profiles_username 
  on public.profiles(shop_id, username) 
  where username is not null;

-- Update admin seed to have a username
update public.profiles
set username = 'dinhcongnhat'
where id = 'a0000000-0000-0000-0000-000000000001'
  and username is null;
