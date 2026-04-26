create or replace function public.deduct_credits_for_generation(
  p_user_id uuid,
  p_credits_needed integer,
  p_model text,
  p_is_pro_model boolean
)
returns table(success boolean, used_free_tier boolean, remaining_credits integer, error_message text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_current_credits integer;
  v_free_pro_used integer;
  v_profile_exists boolean;
begin
  select exists(select 1 from public.profiles where id = p_user_id) into v_profile_exists;

  if not v_profile_exists then
    return query select false, false, 0, 'User profile not found'::text;
    return;
  end if;

  select credits, free_pro_generations_used
  into v_current_credits, v_free_pro_used
  from public.profiles where id = p_user_id
  for update;

  if p_is_pro_model then
    if v_free_pro_used < 3 then
      update public.profiles
      set free_pro_generations_used = free_pro_generations_used + 1,
          updated_at = now()
      where id = p_user_id;

      insert into public.credit_transactions (user_id, amount, type, description, metadata)
      values (
        p_user_id,
        0,
        'free_pro_tier',
        'Free Pro generation used',
        jsonb_build_object('model', p_model, 'free_count', v_free_pro_used + 1)
      );

      return query select
        true,
        true,
        v_current_credits,
        format('Used free Pro generation %s/3', v_free_pro_used + 1)::text;
      return;
    end if;
  end if;

  if v_current_credits < p_credits_needed then
    return query select
      false,
      false,
      v_current_credits,
      format('Insufficient credits. Needed: %s, Have: %s', p_credits_needed, v_current_credits)::text;
    return;
  end if;

  update public.profiles
  set credits = credits - p_credits_needed,
      updated_at = now()
  where id = p_user_id;

  insert into public.credit_transactions (user_id, amount, type, description, metadata)
  values (
    p_user_id,
    -p_credits_needed,
    'generation',
    format('SVG generation using %s', p_model),
    jsonb_build_object('model', p_model, 'credits_used', p_credits_needed)
  );

  return query select
    true,
    false,
    v_current_credits - p_credits_needed,
    'Credits deducted successfully'::text;
end;
$$;

revoke execute on function public.deduct_credits_for_generation(uuid, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.deduct_credits_for_generation(uuid, integer, text, boolean) to service_role;
