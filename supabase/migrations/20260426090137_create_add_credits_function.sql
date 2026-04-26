create or replace function public.add_credits_after_purchase(
  p_user_id uuid,
  p_purchase_id uuid,
  p_credits_amount integer
)
returns boolean language plpgsql security definer
set search_path = ''
as $$
begin
  if p_credits_amount <= 0 then
    raise exception 'p_credits_amount must be a positive integer, got %', p_credits_amount;
  end if;

  -- Atomically claim the purchase: only proceed if it is still pending.
  -- This is the idempotency guard — concurrent/duplicate calls will not match.
  update public.credit_purchases
  set status = 'completed',
      completed_at = now()
  where id = p_purchase_id
    and status <> 'completed';

  if not found then
    -- Already processed; return true without double-crediting.
    return true;
  end if;

  update public.profiles
  set credits = credits + p_credits_amount,
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'User profile not found for id %', p_user_id;
  end if;

  insert into public.credit_transactions (user_id, amount, type, description, purchase_id, metadata)
  values (
    p_user_id,
    p_credits_amount,
    'purchase',
    format('Purchased %s credits', p_credits_amount),
    p_purchase_id,
    jsonb_build_object('purchase_id', p_purchase_id)
  );

  return true;
end;
$$;

revoke execute on function public.add_credits_after_purchase(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.add_credits_after_purchase(uuid, uuid, integer) to service_role;
