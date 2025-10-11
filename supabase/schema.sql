--
-- Supabase schema bootstrap for Team Sub Planner.
-- This script creates every table, index, and Row Level Security policy that allows each coach
-- to manage their own rosters while keeping data private. We keep the statements verbose so
-- future contributors understand why each piece exists.
--

-- Ensure UUID helpers are available for primary key generation.
create extension if not exists "pgcrypto";

-- Shared catalog of sports so teams can inherit sensible defaults.
create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.sports is 'Shared catalog of sports so teams can attach default positions and analytics metadata.';

-- Application-level profile that references Supabase auth users. This gives us a stable foreign key
-- target for ownership and keeps app-specific fields out of auth.users.
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.app_users is 'Application-level profile keyed to Supabase auth user IDs.';
comment on column public.app_users.auth_user_id is 'Supabase auth.users.id that owns this app profile.';

-- Teams belong to a single app user for now. We store sport_id instead of freeform text so positions
-- and analytics can key off a known catalog entry.
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users (id) on delete cascade,
  sport_id uuid not null references public.sports (id) on delete restrict,
  name text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists teams_owner_id_idx on public.teams (owner_id);
create index if not exists teams_owner_sport_idx on public.teams (owner_id, sport_id);
create index if not exists teams_owner_name_idx on public.teams (owner_id, name);

-- Position library. Rows with owner_id NULL are centrally seeded defaults. Rows with an owner_id are
-- custom overrides that only the owning coach can change. Keeping everything in one table simplifies
-- joins from games/players.
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports (id) on delete cascade,
  owner_id uuid references public.app_users (id) on delete cascade,
  code text not null,
  label text not null,
  description text,
  order_index integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists positions_default_code_idx on public.positions (sport_id, code) where owner_id is null;
create unique index if not exists positions_custom_code_idx on public.positions (owner_id, sport_id, code) where owner_id is not null;
create index if not exists positions_owner_order_idx on public.positions (owner_id, sport_id, order_index);

comment on table public.positions is 'Sport-specific positions; NULL owner rows are global defaults, non-null owner rows are user overrides.';

-- Player roster entries. primary_position_id is optional but keeps the most common slot handy for UI hints.
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  full_name text not null,
  jersey_number text,
  primary_position_id uuid references public.positions (id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists players_team_id_idx on public.players (team_id);
create unique index if not exists players_unique_name_per_team_idx on public.players (team_id, full_name);

-- Many-to-many join capturing secondary position preferences so substitution helpers can reason about fit.
create table if not exists public.player_position_preferences (
  player_id uuid not null references public.players (id) on delete cascade,
  position_id uuid not null references public.positions (id) on delete cascade,
  preference_rank smallint,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (player_id, position_id)
);

create index if not exists player_position_preferences_rank_idx on public.player_position_preferences (player_id, preference_rank);

-- Games represent a single match or session for a team. players_on_field helps parameterize substitution logic.
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  opponent text,
  scheduled_start timestamptz,
  location text,
  players_on_field integer check (players_on_field is null or players_on_field > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'complete', 'canceled')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists games_team_start_idx on public.games (team_id, scheduled_start desc);

-- Each roster slot stores the canonical order and optional position assignment for a game. order_index is the
-- drag-and-drop ordering, while position_id anchors to either a default or custom position definition.
create table if not exists public.game_roster_slots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  order_index integer not null,
  position_id uuid references public.positions (id),
  status text not null check (status in ('on_field', 'bench')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (game_id, player_id),
  unique (game_id, order_index)
);

create index if not exists game_roster_slots_game_idx on public.game_roster_slots (game_id, status, order_index);

-- Substitution log to capture in/out events for later analytics like playtime or points.
create table if not exists public.substitutions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_out_id uuid references public.players (id) on delete set null,
  player_in_id uuid references public.players (id) on delete set null,
  occurred_at timestamptz not null default timezone('utc', now()),
  period text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists substitutions_game_time_idx on public.substitutions (game_id, occurred_at);

-- Helper function: maps auth.uid() to the matching app_users.id so RLS can target ownership easily.
create or replace function public.app_current_user_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.app_users where auth_user_id = auth.uid();
$$;

comment on function public.app_current_user_id() is 'Returns the app_users.id for the currently authenticated Supabase user.';

-- Enable Row Level Security on every user-owned table. sports stays enabled too so policies can run.
alter table public.sports enable row level security;
alter table public.app_users enable row level security;
alter table public.teams enable row level security;
alter table public.positions enable row level security;
alter table public.players enable row level security;
alter table public.player_position_preferences enable row level security;
alter table public.games enable row level security;
alter table public.game_roster_slots enable row level security;
alter table public.substitutions enable row level security;

-- Force RLS to guarantee future policies cannot be bypassed accidentally.
alter table public.teams force row level security;
alter table public.positions force row level security;
alter table public.players force row level security;
alter table public.games force row level security;
alter table public.game_roster_slots force row level security;
alter table public.substitutions force row level security;

-- Sports are read-only catalog data for regular users. Everyone can read; only elevated roles will be able
-- to insert/update/delete (no policies defined for those operations here).
create policy sports_select_all on public.sports
  for select using (true);

-- Users may only view and mutate their own profile row.
create policy app_users_select_self on public.app_users
  for select using (auth.uid() = auth_user_id);

create policy app_users_insert_self on public.app_users
  for insert with check (auth.uid() = auth_user_id);

create policy app_users_update_self on public.app_users
  for update using (auth.uid() = auth_user_id)
            with check (auth.uid() = auth_user_id);

create policy app_users_delete_self on public.app_users
  for delete using (auth.uid() = auth_user_id);

-- Teams remain private to the owning coach.
create policy teams_select_owned on public.teams
  for select using (owner_id = public.app_current_user_id());

create policy teams_insert_owned on public.teams
  for insert with check (owner_id = public.app_current_user_id());

create policy teams_update_owned on public.teams
  for update using (owner_id = public.app_current_user_id())
            with check (owner_id = public.app_current_user_id());

create policy teams_delete_owned on public.teams
  for delete using (owner_id = public.app_current_user_id());

-- Position defaults are readable by everyone, but only the owning coach can modify their custom entries.
create policy positions_select_readable on public.positions
  for select using (
    owner_id is null
    or owner_id = public.app_current_user_id()
  );

create policy positions_insert_owned on public.positions
  for insert with check (owner_id = public.app_current_user_id());

create policy positions_update_owned on public.positions
  for update using (owner_id = public.app_current_user_id())
            with check (owner_id = public.app_current_user_id());

create policy positions_delete_owned on public.positions
  for delete using (owner_id = public.app_current_user_id());

-- Players can only reference teams and positions the owner controls (or the global defaults).
create policy players_select_owned on public.players
  for select using (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  );

create policy players_insert_owned on public.players
  for insert with check (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
    and (
      primary_position_id is null
      or primary_position_id in (
        select id from public.positions
        where sport_id = (
          select sport_id from public.teams where id = public.players.team_id
        )
        and (
          owner_id is null
          or owner_id = public.app_current_user_id()
        )
      )
    )
  );

create policy players_update_owned on public.players
  for update using (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  ) with check (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
    and (
      primary_position_id is null
      or primary_position_id in (
        select id from public.positions
        where sport_id = (
          select sport_id from public.teams where id = public.players.team_id
        )
        and (
          owner_id is null
          or owner_id = public.app_current_user_id()
        )
      )
    )
  );

create policy players_delete_owned on public.players
  for delete using (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  );

-- Preferences inherit ownership through the player and ensure referenced positions are either defaults or
-- owned by the same coach.
create policy player_pref_select_owned on public.player_position_preferences
  for select using (
    player_id in (
      select id from public.players
      where team_id in (
        select id from public.teams where owner_id = public.app_current_user_id()
      )
    )
  );

create policy player_pref_insert_owned on public.player_position_preferences
  for insert with check (
    player_id in (
      select id from public.players
      where team_id in (
        select id from public.teams where owner_id = public.app_current_user_id()
      )
    )
    and position_id in (
      select id from public.positions
      where (
        owner_id is null
        or owner_id = public.app_current_user_id()
      )
    )
  );

create policy player_pref_update_owned on public.player_position_preferences
  for update using (
    player_id in (
      select id from public.players
      where team_id in (
        select id from public.teams where owner_id = public.app_current_user_id()
      )
    )
  ) with check (
    position_id in (
      select id from public.positions
      where (
        owner_id is null
        or owner_id = public.app_current_user_id()
      )
    )
  );

create policy player_pref_delete_owned on public.player_position_preferences
  for delete using (
    player_id in (
      select id from public.players
      where team_id in (
        select id from public.teams where owner_id = public.app_current_user_id()
      )
    )
  );

-- Games follow the same ownership pattern as teams/players.
create policy games_select_owned on public.games
  for select using (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  );

create policy games_insert_owned on public.games
  for insert with check (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  );

create policy games_update_owned on public.games
  for update using (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  ) with check (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  );

create policy games_delete_owned on public.games
  for delete using (
    team_id in (
      select id from public.teams where owner_id = public.app_current_user_id()
    )
  );

-- Game roster slots ensure the game belongs to the owner, the player belongs to the owner's team, and any
-- referenced position is either a default or custom row owned by the same coach.
create policy roster_slots_select_owned on public.game_roster_slots
  for select using (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
  );

create policy roster_slots_insert_owned on public.game_roster_slots
  for insert with check (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
    and player_id in (
      select p.id
      from public.players p
      join public.teams t on t.id = p.team_id
      where t.owner_id = public.app_current_user_id()
    )
    and (
      position_id is null
      or position_id in (
        select id from public.positions
        where (
          owner_id is null
          or owner_id = public.app_current_user_id()
        )
      )
    )
  );

create policy roster_slots_update_owned on public.game_roster_slots
  for update using (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
  ) with check (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
    and player_id in (
      select p.id
      from public.players p
      join public.teams t on t.id = p.team_id
      where t.owner_id = public.app_current_user_id()
    )
    and (
      position_id is null
      or position_id in (
        select id from public.positions
        where (
          owner_id is null
          or owner_id = public.app_current_user_id()
        )
      )
    )
  );

create policy roster_slots_delete_owned on public.game_roster_slots
  for delete using (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
  );

-- Substitutions inherit ownership through the game and ensure referenced players belong to the same team.
create policy substitutions_select_owned on public.substitutions
  for select using (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
  );

create policy substitutions_insert_owned on public.substitutions
  for insert with check (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
    and (
      player_in_id is null
      or player_in_id in (
        select p.id
        from public.players p
        join public.teams t on t.id = p.team_id
        where t.owner_id = public.app_current_user_id()
      )
    )
    and (
      player_out_id is null
      or player_out_id in (
        select p.id
        from public.players p
        join public.teams t on t.id = p.team_id
        where t.owner_id = public.app_current_user_id()
      )
    )
  );

create policy substitutions_update_owned on public.substitutions
  for update using (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
  ) with check (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
    and (
      player_in_id is null
      or player_in_id in (
        select p.id
        from public.players p
        join public.teams t on t.id = p.team_id
        where t.owner_id = public.app_current_user_id()
      )
    )
    and (
      player_out_id is null
      or player_out_id in (
        select p.id
        from public.players p
        join public.teams t on t.id = p.team_id
        where t.owner_id = public.app_current_user_id()
      )
    )
  );

create policy substitutions_delete_owned on public.substitutions
  for delete using (
    game_id in (
      select g.id
      from public.games g
      join public.teams t on t.id = g.team_id
      where t.owner_id = public.app_current_user_id()
    )
  );
