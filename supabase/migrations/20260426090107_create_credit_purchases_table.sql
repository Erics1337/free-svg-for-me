create table public.credit_purchases (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text not null,
  stripe_payment_intent_id text,
  credits_amount integer not null,
  amount_paid_cents integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (id)
);

alter table public.credit_purchases enable row level security;

grant select on public.credit_purchases to authenticated;

create policy "Users can view their own purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);
