# Supabase Schema Playbook

This document explains how to apply the schema stored in `supabase/schema.sql`, seed default sports/positions, and prepare the app for authenticated usage. Every section calls out when you will need to interact with the **Supabase web dashboard (GUI)** so you can plan in advance.

## 1. Apply the core schema
1. **Confirm prerequisites (CLI only):** Make sure your Supabase project is created and you have the Project URL plus anon key stored in `.env.local` so local builds keep working.
2. **Open the Supabase SQL Editor (**GUI required**):** Sign in at [app.supabase.com](https://app.supabase.com), select your project, and launch the *SQL Editor* from the left navigation.
3. **Paste the schema script:** Copy the full contents of `supabase/schema.sql` from this repository and paste it into the SQL editor panel.
4. **Run the script:** Click the *Run* button in the GUI. Supabase will create every table, index, helper function, and row-level security policy defined in the file. The script is written to be idempotent so you can re-run it safely when adding new environments.
5. **Verify tables (GUI optional but recommended):** In the *Table Editor*, you should now see `sports`, `app_users`, `teams`, `positions`, `players`, `player_position_preferences`, `games`, `game_roster_slots`, and `substitutions`.

   > **Team-alignment guard:** The RLS policies inside `supabase/schema.sql` now include `exists` checks that ensure every roster slot and substitution references players from the same team as the game. If you customize the schema later, keep those subqueries intact so multi-team coaches cannot cross-wire their data.

> **CLI alternative:** If you prefer the Supabase CLI, run `supabase db remote commit --file supabase/schema.sql` (you will still need to authenticate in the terminal). The CLI path is optional; the SQL Editor flow above is usually faster during early development.

### Optional: Add read-friendly positions view
1. **Plan the change (CLI only):** The view presents `positions` joined with `sports` so the Supabase Table Editor lists human-readable sport codes alongside each row. No data is duplicated—Postgres recalculates the join every time you query the view.
2. **Open the SQL Editor (**GUI required**):** In the Supabase dashboard, open *SQL Editor* for your project (same place you executed the schema script).
3. **Run the view statement:** Paste the SQL below and click *Run*. Re-running the statement later is safe because `create or replace view` updates the definition in place.

   ```sql
   create or replace view public.positions_with_sport
   with (security_invoker = on) as
     select
       p.id,
       p.sport_id,
       s.code as sport_code,
       s.name as sport_name,
       p.owner_id,
       p.code as position_code,
       p.label,
       p.description,
       p.order_index,
       p.created_at,
       p.updated_at
     from public.positions p
     join public.sports s on s.id = p.sport_id;
   ```

4. **Lock down API access (**GUI required**):** Supabase auto-grants read access on new views to the `anon` role, which powers public API calls. Run the revokes below in the same SQL Editor to keep the view private while still allowing authenticated sessions to query it. This mirrors the base table permissions and silences the dashboard warning.

   ```sql
   revoke all on public.positions_with_sport from public, anon;
   grant select on public.positions_with_sport to authenticated;
   ```

5. **Verify the view (GUI optional but helpful):** In *Table Editor*, select `positions_with_sport`. You should see every position row plus `sport_code`/`sport_name` pulled from the parent sport.
6. **Usage notes:** Views inherit Row Level Security from their source tables, so this remains safe for per-user data. Application code can query the view directly (`select * from public.positions_with_sport`) whenever it needs both the UUID foreign key and a human-readable sport identifier. Supabase's Table Editor may still display an **Unrestricted** badge because it only checks for RLS on the view itself; the badge is cosmetic as long as the underlying tables enforce RLS. Setting `security_invoker = on` ensures the view always evaluates with the caller's privileges so RLS policies continue to apply.

## 2. Seed default sports and positions
1. **Decide on initial sports (CLI planning):** Gather the sport codes/names you want to seed (e.g., `soccer`, `basketball`, `volleyball`). Each code should be lowercase and URL-safe so we can reuse it for routing.
2. **Insert seeds (**GUI required**):** Use the same SQL Editor to run an insert script similar to the example below. Update the values to match the sports you care about.

   ```sql
   insert into public.sports (code, name)
   values
     ('soccer_u4_u7', 'Super Mod U4-U7 Soccer'),
     ('soccer_u08_b', 'Boys U8 Soccer')
   on conflict (code) do nothing;
   ```

3. **Seed default positions (**GUI required**):** For every sport, insert a batch of default positions with `owner_id` set to `null` (this marks them as global defaults). Example for soccer:

   ```sql
   with upserted_sport as (
     select id from public.sports where code = 'soccer_u08_b'
   )
   insert into public.positions (sport_id, owner_id, code, label, description, order_index)
   select
     upserted_sport.id,
     null,
     pos.code,
     pos.label,
     pos.description,
     pos.order_index
   from upserted_sport,
   lateral (
     values
       ('gk', 'Goalkeeper', 'Primary goalkeeper slot', 0),
       ('lb', 'Left Back', 'Defensive wing on the left side', 1),
       ('cb', 'Center Back', 'Central defender', 2),
       ('rb', 'Right Back', 'Defensive wing on the right side', 3),
       ('lm', 'Left Midfield', 'Wide midfielder on the left', 4),
       ('cm', 'Center Midfield', 'Central midfield anchor', 5),
       ('rm', 'Right Midfield', 'Wide midfielder on the right', 6),
       ('fw', 'Forward', 'Attacking forward slot', 7)
   ) as pos(code, label, description, order_index)
   on conflict (sport_id, code) where owner_id is null do update
   set label = excluded.label,
       description = excluded.description,
       order_index = excluded.order_index;
   ```

4. **Repeat for other sports:** Adjust the value list for basketball, volleyball, etc. Keep the `on conflict` clause so re-running the seed keeps defaults in sync.

## 3. Clone defaults when a team is created (planned feature)
The application should duplicate default positions into user-owned rows as soon as a coach creates a team. Until the feature is implemented, you can test the SQL manually in the GUI:

```sql
-- Replace :team_id with the new team UUID and :owner_id with the app_users.id for the coach.
insert into public.positions (id, sport_id, owner_id, code, label, description, order_index)
select
  gen_random_uuid(),
  sport_id,
  :owner_id,
  code,
  label,
  description,
  order_index
from public.positions
where sport_id = :sport_id
  and owner_id is null;
```

To reset a team back to defaults later, delete the coach-owned rows and re-run the same insert statement. When we build the TanStack Query mutation this SQL acts as the source of truth.

## 4. Application follow-ups
- **Auth hook:** Ensure the app upserts a row into `public.app_users` immediately after a successful Supabase login. Without that row the RLS policies cannot resolve ownership.
- **Type generation:** After the schema is live, regenerate Supabase TypeScript types so the client receives end-to-end type safety. Command: `supabase gen types typescript --project-id <id> --schema public > src/lib/database.types.ts`.
- **Testing:** Extend Vitest suites to cover happy-path queries/mutations and verify RLS handling using mocked Supabase clients. The schema relies on the default position duplication logic, so plan tests around that behavior as soon as the feature is wired.

## 5. Troubleshooting tips
- If the SQL Editor reports RLS errors when inserting data, double-check that an `app_users` row exists for the logged-in user (`select * from public.app_users;`).
- The `positions_custom_code_idx` index enforces uniqueness per coach. If you seed duplicate codes for the same coach/sport combination the insert will fail; adjust your code names or purge old custom rows first.
- When experimenting in local development, you can cleanly reset a table by `truncate`-ing it in the SQL Editor. The schema uses cascading foreign keys, so truncating `teams` will clear players/games in a single statement. Always re-run the seeds afterward.

Following this guide keeps the schema synchronized across environments and gives every new teammate a predictable onboarding path.
