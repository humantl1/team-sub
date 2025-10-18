


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."app_current_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select id from public.app_users where auth_user_id = auth.uid();
$$;


ALTER FUNCTION "public"."app_current_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."app_current_user_id"() IS 'Returns the app_users.id for the currently authenticated Supabase user.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_users" IS 'Application-level profile keyed to Supabase auth user IDs.';



COMMENT ON COLUMN "public"."app_users"."auth_user_id" IS 'Supabase auth.users.id that owns this app profile.';



CREATE TABLE IF NOT EXISTS "public"."game_roster_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "position_id" "uuid",
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "game_roster_slots_status_check" CHECK (("status" = ANY (ARRAY['on_field'::"text", 'bench'::"text"])))
);

ALTER TABLE ONLY "public"."game_roster_slots" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_roster_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "opponent" "text",
    "scheduled_start" timestamp with time zone,
    "location" "text",
    "players_on_field" integer,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "games_players_on_field_check" CHECK ((("players_on_field" IS NULL) OR ("players_on_field" > 0))),
    CONSTRAINT "games_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'complete'::"text", 'canceled'::"text"])))
);

ALTER TABLE ONLY "public"."games" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_position_preferences" (
    "player_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "preference_rank" smallint,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."player_position_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "jersey_number" "text",
    "primary_position_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "players_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);

ALTER TABLE ONLY "public"."players" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sport_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "order_index" integer,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."positions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."positions" OWNER TO "postgres";


COMMENT ON TABLE "public"."positions" IS 'Sport-specific positions; NULL owner rows are global defaults, non-null owner rows are user overrides.';



CREATE TABLE IF NOT EXISTS "public"."sports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sports" OWNER TO "postgres";


COMMENT ON TABLE "public"."sports" IS 'Shared catalog of sports so teams can attach default positions and analytics metadata.';



CREATE OR REPLACE VIEW "public"."positions_with_sport" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."sport_id",
    "s"."code" AS "sport_code",
    "s"."name" AS "sport_name",
    "p"."owner_id",
    "p"."code" AS "position_code",
    "p"."label",
    "p"."description",
    "p"."order_index",
    "p"."created_at",
    "p"."updated_at"
   FROM ("public"."positions" "p"
     JOIN "public"."sports" "s" ON (("s"."id" = "p"."sport_id")));


ALTER VIEW "public"."positions_with_sport" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."substitutions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "player_out_id" "uuid",
    "player_in_id" "uuid",
    "occurred_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "period" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."substitutions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."substitutions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "sport_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."teams" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_roster_slots"
    ADD CONSTRAINT "game_roster_slots_game_id_order_index_key" UNIQUE ("game_id", "order_index");



ALTER TABLE ONLY "public"."game_roster_slots"
    ADD CONSTRAINT "game_roster_slots_game_id_player_id_key" UNIQUE ("game_id", "player_id");



ALTER TABLE ONLY "public"."game_roster_slots"
    ADD CONSTRAINT "game_roster_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_position_preferences"
    ADD CONSTRAINT "player_position_preferences_pkey" PRIMARY KEY ("player_id", "position_id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE INDEX "game_roster_slots_game_idx" ON "public"."game_roster_slots" USING "btree" ("game_id", "status", "order_index");



CREATE INDEX "games_team_start_idx" ON "public"."games" USING "btree" ("team_id", "scheduled_start" DESC);



CREATE INDEX "player_position_preferences_rank_idx" ON "public"."player_position_preferences" USING "btree" ("player_id", "preference_rank");



CREATE INDEX "players_team_id_idx" ON "public"."players" USING "btree" ("team_id");



CREATE UNIQUE INDEX "players_unique_name_per_team_idx" ON "public"."players" USING "btree" ("team_id", "full_name");



CREATE UNIQUE INDEX "positions_custom_code_idx" ON "public"."positions" USING "btree" ("owner_id", "sport_id", "code") WHERE ("owner_id" IS NOT NULL);



CREATE UNIQUE INDEX "positions_default_code_idx" ON "public"."positions" USING "btree" ("sport_id", "code") WHERE ("owner_id" IS NULL);



CREATE INDEX "positions_owner_order_idx" ON "public"."positions" USING "btree" ("owner_id", "sport_id", "order_index");



CREATE INDEX "substitutions_game_time_idx" ON "public"."substitutions" USING "btree" ("game_id", "occurred_at");



CREATE INDEX "teams_owner_id_idx" ON "public"."teams" USING "btree" ("owner_id");



CREATE INDEX "teams_owner_name_idx" ON "public"."teams" USING "btree" ("owner_id", "name");



CREATE INDEX "teams_owner_sport_idx" ON "public"."teams" USING "btree" ("owner_id", "sport_id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_roster_slots"
    ADD CONSTRAINT "game_roster_slots_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_roster_slots"
    ADD CONSTRAINT "game_roster_slots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_roster_slots"
    ADD CONSTRAINT "game_roster_slots_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_position_preferences"
    ADD CONSTRAINT "player_position_preferences_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_position_preferences"
    ADD CONSTRAINT "player_position_preferences_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_primary_position_id_fkey" FOREIGN KEY ("primary_position_id") REFERENCES "public"."positions"("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_player_in_id_fkey" FOREIGN KEY ("player_in_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_player_out_id_fkey" FOREIGN KEY ("player_out_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE RESTRICT;



ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_users_delete_self" ON "public"."app_users" FOR DELETE USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "app_users_insert_self" ON "public"."app_users" FOR INSERT WITH CHECK (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "app_users_select_self" ON "public"."app_users" FOR SELECT USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "app_users_update_self" ON "public"."app_users" FOR UPDATE USING (("auth"."uid"() = "auth_user_id")) WITH CHECK (("auth"."uid"() = "auth_user_id"));



ALTER TABLE "public"."game_roster_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "games_delete_owned" ON "public"."games" FOR DELETE USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "games_insert_owned" ON "public"."games" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "games_select_owned" ON "public"."games" FOR SELECT USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "games_update_owned" ON "public"."games" FOR UPDATE USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"())))) WITH CHECK (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))));



ALTER TABLE "public"."player_position_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_pref_delete_owned" ON "public"."player_position_preferences" FOR DELETE USING (("player_id" IN ( SELECT "players"."id"
   FROM "public"."players"
  WHERE ("players"."team_id" IN ( SELECT "teams"."id"
           FROM "public"."teams"
          WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))))));



CREATE POLICY "player_pref_insert_owned" ON "public"."player_position_preferences" FOR INSERT WITH CHECK ((("player_id" IN ( SELECT "players"."id"
   FROM "public"."players"
  WHERE ("players"."team_id" IN ( SELECT "teams"."id"
           FROM "public"."teams"
          WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))))) AND ("position_id" IN ( SELECT "positions"."id"
   FROM "public"."positions"
  WHERE (("positions"."owner_id" IS NULL) OR ("positions"."owner_id" = "public"."app_current_user_id"()))))));



CREATE POLICY "player_pref_select_owned" ON "public"."player_position_preferences" FOR SELECT USING (("player_id" IN ( SELECT "players"."id"
   FROM "public"."players"
  WHERE ("players"."team_id" IN ( SELECT "teams"."id"
           FROM "public"."teams"
          WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))))));



CREATE POLICY "player_pref_update_owned" ON "public"."player_position_preferences" FOR UPDATE USING (("player_id" IN ( SELECT "players"."id"
   FROM "public"."players"
  WHERE ("players"."team_id" IN ( SELECT "teams"."id"
           FROM "public"."teams"
          WHERE ("teams"."owner_id" = "public"."app_current_user_id"())))))) WITH CHECK (("position_id" IN ( SELECT "positions"."id"
   FROM "public"."positions"
  WHERE (("positions"."owner_id" IS NULL) OR ("positions"."owner_id" = "public"."app_current_user_id"())))));



ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "players_delete_owned" ON "public"."players" FOR DELETE USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "players_insert_owned" ON "public"."players" FOR INSERT WITH CHECK ((("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))) AND (("primary_position_id" IS NULL) OR ("primary_position_id" IN ( SELECT "positions"."id"
   FROM "public"."positions"
  WHERE (("positions"."sport_id" = ( SELECT "teams"."sport_id"
           FROM "public"."teams"
          WHERE ("teams"."id" = "players"."team_id"))) AND (("positions"."owner_id" IS NULL) OR ("positions"."owner_id" = "public"."app_current_user_id"()))))))));



CREATE POLICY "players_select_owned" ON "public"."players" FOR SELECT USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "players_update_owned" ON "public"."players" FOR UPDATE USING (("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"())))) WITH CHECK ((("team_id" IN ( SELECT "teams"."id"
   FROM "public"."teams"
  WHERE ("teams"."owner_id" = "public"."app_current_user_id"()))) AND (("primary_position_id" IS NULL) OR ("primary_position_id" IN ( SELECT "positions"."id"
   FROM "public"."positions"
  WHERE (("positions"."sport_id" = ( SELECT "teams"."sport_id"
           FROM "public"."teams"
          WHERE ("teams"."id" = "players"."team_id"))) AND (("positions"."owner_id" IS NULL) OR ("positions"."owner_id" = "public"."app_current_user_id"()))))))));



ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "positions_delete_owned" ON "public"."positions" FOR DELETE USING (("owner_id" = "public"."app_current_user_id"()));



CREATE POLICY "positions_insert_owned" ON "public"."positions" FOR INSERT WITH CHECK (("owner_id" = "public"."app_current_user_id"()));



CREATE POLICY "positions_select_readable" ON "public"."positions" FOR SELECT USING ((("owner_id" IS NULL) OR ("owner_id" = "public"."app_current_user_id"())));



CREATE POLICY "positions_update_owned" ON "public"."positions" FOR UPDATE USING (("owner_id" = "public"."app_current_user_id"())) WITH CHECK (("owner_id" = "public"."app_current_user_id"()));



CREATE POLICY "roster_slots_delete_owned" ON "public"."game_roster_slots" FOR DELETE USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "roster_slots_insert_owned" ON "public"."game_roster_slots" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM (("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
     JOIN "public"."players" "p" ON (("p"."id" = "game_roster_slots"."player_id")))
  WHERE (("g"."id" = "game_roster_slots"."game_id") AND ("p"."team_id" = "g"."team_id") AND ("t"."owner_id" = "public"."app_current_user_id"())))) AND (("position_id" IS NULL) OR ("position_id" IN ( SELECT "positions"."id"
   FROM "public"."positions"
  WHERE (("positions"."owner_id" IS NULL) OR ("positions"."owner_id" = "public"."app_current_user_id"())))))));



CREATE POLICY "roster_slots_select_owned" ON "public"."game_roster_slots" FOR SELECT USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "roster_slots_update_owned" ON "public"."game_roster_slots" FOR UPDATE USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"())))) WITH CHECK ((("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"()))) AND (EXISTS ( SELECT 1
   FROM (("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
     JOIN "public"."players" "p" ON (("p"."id" = "game_roster_slots"."player_id")))
  WHERE (("g"."id" = "game_roster_slots"."game_id") AND ("p"."team_id" = "g"."team_id") AND ("t"."owner_id" = "public"."app_current_user_id"())))) AND (("position_id" IS NULL) OR ("position_id" IN ( SELECT "positions"."id"
   FROM "public"."positions"
  WHERE (("positions"."owner_id" IS NULL) OR ("positions"."owner_id" = "public"."app_current_user_id"())))))));



ALTER TABLE "public"."sports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sports_select_all" ON "public"."sports" FOR SELECT USING (true);



ALTER TABLE "public"."substitutions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "substitutions_delete_owned" ON "public"."substitutions" FOR DELETE USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "substitutions_insert_owned" ON "public"."substitutions" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE (("g"."id" = "substitutions"."game_id") AND ("t"."owner_id" = "public"."app_current_user_id"())))) AND (("player_in_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM ("public"."players" "p"
     JOIN "public"."games" "g" ON (("g"."id" = "substitutions"."game_id")))
  WHERE (("p"."id" = "substitutions"."player_in_id") AND ("p"."team_id" = "g"."team_id"))))) AND (("player_out_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM ("public"."players" "p"
     JOIN "public"."games" "g" ON (("g"."id" = "substitutions"."game_id")))
  WHERE (("p"."id" = "substitutions"."player_out_id") AND ("p"."team_id" = "g"."team_id")))))));



CREATE POLICY "substitutions_select_owned" ON "public"."substitutions" FOR SELECT USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"()))));



CREATE POLICY "substitutions_update_owned" ON "public"."substitutions" FOR UPDATE USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"())))) WITH CHECK ((("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."teams" "t" ON (("t"."id" = "g"."team_id")))
  WHERE ("t"."owner_id" = "public"."app_current_user_id"()))) AND (("player_in_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM ("public"."players" "p"
     JOIN "public"."games" "g" ON (("g"."id" = "substitutions"."game_id")))
  WHERE (("p"."id" = "substitutions"."player_in_id") AND ("p"."team_id" = "g"."team_id"))))) AND (("player_out_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM ("public"."players" "p"
     JOIN "public"."games" "g" ON (("g"."id" = "substitutions"."game_id")))
  WHERE (("p"."id" = "substitutions"."player_out_id") AND ("p"."team_id" = "g"."team_id")))))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_delete_owned" ON "public"."teams" FOR DELETE USING (("owner_id" = "public"."app_current_user_id"()));



CREATE POLICY "teams_insert_owned" ON "public"."teams" FOR INSERT WITH CHECK (("owner_id" = "public"."app_current_user_id"()));



CREATE POLICY "teams_select_owned" ON "public"."teams" FOR SELECT USING (("owner_id" = "public"."app_current_user_id"()));



CREATE POLICY "teams_update_owned" ON "public"."teams" FOR UPDATE USING (("owner_id" = "public"."app_current_user_id"())) WITH CHECK (("owner_id" = "public"."app_current_user_id"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."app_current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."app_current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_current_user_id"() TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON TABLE "public"."game_roster_slots" TO "anon";
GRANT ALL ON TABLE "public"."game_roster_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."game_roster_slots" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."player_position_preferences" TO "anon";
GRANT ALL ON TABLE "public"."player_position_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."player_position_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."positions" TO "anon";
GRANT ALL ON TABLE "public"."positions" TO "authenticated";
GRANT ALL ON TABLE "public"."positions" TO "service_role";



GRANT ALL ON TABLE "public"."sports" TO "anon";
GRANT ALL ON TABLE "public"."sports" TO "authenticated";
GRANT ALL ON TABLE "public"."sports" TO "service_role";



GRANT ALL ON TABLE "public"."positions_with_sport" TO "authenticated";
GRANT ALL ON TABLE "public"."positions_with_sport" TO "service_role";



GRANT ALL ON TABLE "public"."substitutions" TO "anon";
GRANT ALL ON TABLE "public"."substitutions" TO "authenticated";
GRANT ALL ON TABLE "public"."substitutions" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
