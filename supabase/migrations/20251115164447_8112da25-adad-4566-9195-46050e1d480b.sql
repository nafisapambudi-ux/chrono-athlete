-- Create profiles table for users (coaches)
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Function to handle new user signups
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Trigger to auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create athletes table
create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  mass numeric,
  body_height numeric,
  vertical_jump numeric,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.athletes enable row level security;

create policy "Users can view own athletes"
  on public.athletes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own athletes"
  on public.athletes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own athletes"
  on public.athletes for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own athletes"
  on public.athletes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create training_sessions table
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  session_date date not null,
  duration_minutes integer not null,
  rpe integer not null check (rpe >= 1 and rpe <= 10),
  notes text,
  created_at timestamp with time zone default now() not null
);

alter table public.training_sessions enable row level security;

create policy "Users can view sessions for own athletes"
  on public.training_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = training_sessions.athlete_id
      and athletes.user_id = auth.uid()
    )
  );

create policy "Users can insert sessions for own athletes"
  on public.training_sessions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.athletes
      where athletes.id = training_sessions.athlete_id
      and athletes.user_id = auth.uid()
    )
  );

create policy "Users can update sessions for own athletes"
  on public.training_sessions for update
  to authenticated
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = training_sessions.athlete_id
      and athletes.user_id = auth.uid()
    )
  );

create policy "Users can delete sessions for own athletes"
  on public.training_sessions for delete
  to authenticated
  using (
    exists (
      select 1 from public.athletes
      where athletes.id = training_sessions.athlete_id
      and athletes.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger to auto-update updated_at on athletes
create trigger update_athletes_updated_at
  before update on public.athletes
  for each row
  execute function public.update_updated_at_column();

-- Create indexes for better performance
create index idx_athletes_user_id on public.athletes(user_id);
create index idx_training_sessions_athlete_id on public.training_sessions(athlete_id);
create index idx_training_sessions_date on public.training_sessions(session_date);