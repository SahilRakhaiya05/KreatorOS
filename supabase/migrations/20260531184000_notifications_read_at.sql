-- Add read_at column to notifications table
alter table public.notifications 
  add column if not exists read_at timestamptz;
