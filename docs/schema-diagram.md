# Supabase Schema Diagram

This diagram packages the current database thinking into a visual format so you can double-check relationships before touching the Supabase GUI. Because this project doubles as a learning sandbox, the annotations explain why each entity exists and how the arrows reflect the foreign key rules captured in `supabase/schema.sql`.

```mermaid
%% This ER diagram mirrors supabase/schema.sql and CURRENT_TASK.md so reviewers can validate relationships quickly.
erDiagram
    sports {
        UUID id PK
        TEXT code
        TEXT name
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    app_users {
        UUID id PK
        UUID auth_user_id UNIQUE
        TEXT display_name
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    teams {
        UUID id PK
        UUID owner_id FK
        UUID sport_id FK
        TEXT name
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    positions {
        UUID id PK
        UUID sport_id FK
        UUID owner_id FK NULLABLE
        TEXT code
        TEXT label
        TEXT description
        INTEGER order_index
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    players {
        UUID id PK
        UUID team_id FK
        TEXT full_name
        TEXT jersey_number
        UUID primary_position_id FK NULLABLE
        TEXT status
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    player_position_preferences {
        UUID player_id FK
        UUID position_id FK
        SMALLINT preference_rank
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    games {
        UUID id PK
        UUID team_id FK
        TEXT opponent
        TIMESTAMPTZ scheduled_start
        TEXT location
        INTEGER players_on_field
        TEXT status
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    game_roster_slots {
        UUID id PK
        UUID game_id FK
        UUID player_id FK
        INTEGER order_index
        UUID position_id FK NULLABLE
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    substitutions {
        UUID id PK
        UUID game_id FK
        UUID player_out_id FK NULLABLE
        UUID player_in_id FK NULLABLE
        TIMESTAMPTZ occurred_at
        TEXT period
        TEXT notes
        TIMESTAMPTZ created_at
    }

    app_users ||--o{ teams : "owns"
    sports ||--o{ teams : "supports"
    sports ||--o{ positions : "defines"
    app_users ||--o{ positions : "customizes"
    teams ||--o{ players : "rosters"
    positions ||--o{ players : "primary_position"
    players ||--o{ player_position_preferences : "lists_pref"
    positions ||--o{ player_position_preferences : "appears_in"
    teams ||--o{ games : "schedules"
    games ||--o{ game_roster_slots : "sets_slots"
    players ||--o{ game_roster_slots : "assigned"
    positions ||--o{ game_roster_slots : "slot_role"
    games ||--o{ substitutions : "records"
    players ||--o{ substitutions : "player_in"
    players ||--o{ substitutions : "player_out"
```

## How to view the diagram
- **VS Code preview (recommended):** Open this Markdown file and use the built-in preview or the Mermaid extension to render the graphic locally—no browser navigation required.
- **Mermaid Live Editor (optional GUI):** If you want to tweak or experiment interactively, copy the fenced block into [https://mermaid.live](https://mermaid.live). This is the only time a browser UI becomes useful.
- **CLI-only inspection:** If you need to stick to the terminal, the Mermaid syntax is intentionally readable so you can still reason about the entity relationships without rendering.

Keep this file updated whenever the SQL or schema plan evolves so the visual stays in sync with reality.
