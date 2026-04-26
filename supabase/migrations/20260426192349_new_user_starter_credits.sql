create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, credits, free_pro_generations_used)
  values (new.id, 10, 0)
  on conflict (id) do nothing;
  return new;
end;
$$;
