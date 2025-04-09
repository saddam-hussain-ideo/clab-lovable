
-- Add proper RLS policies for the referrals table
alter table public.referrals enable row level security;

-- Allow users to create referrals
create policy "Allow users to create referrals"
on public.referrals
for insert
to authenticated
with check (true); -- Allowing all authenticated users to create referrals

-- Allow users to view their own referrals (as referrer)
create policy "Users can view referrals they've made"
on public.referrals
for select
to authenticated
using (auth.uid() = referrer_id);

-- Allow users to view referrals they've received
create policy "Users can view referrals they've received"
on public.referrals
for select
to authenticated
using (auth.uid() = referred_id);
