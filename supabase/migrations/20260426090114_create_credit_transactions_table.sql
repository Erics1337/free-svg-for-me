create table public.credit_transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  description text,
  purchase_id uuid references public.credit_purchases(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (id)
);

alter table public.credit_transactions enable row level security;

grant select on public.credit_transactions to authenticated;

create policy "Users can view their own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);
