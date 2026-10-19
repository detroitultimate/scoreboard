---
layout: default
title: DUFL Score Board
---

# DUFL Score Board

Use the Score Board to track an Ultimate Frisbee game. Open it in a modern
browser; no installation or server is needed. Your settings and saved teams
stay in the browser on that device.

## Quick guide

- **📱** Full screen 
- **🌙 / ☀️** switch theme(light/dark) 
- **🔊 / 🔇** toggle timer sounds.
- **⚙️** Open settings: choose teams and colors, set game duration and periods,
  select a gender-ratio rule, and choose/test the clock alert sound.
- **↩️** Undo the latest change. 
- **🧹** reset ALL settings and game data to defaults
  (saved teams and theme are kept); tap again within 3 seconds to confirm.
- Tap a team's **score** to add a point; use **+ / −** to adjust it. Scoring
  advances the point and gender ratio sequence.
- Tap the **point/ratio indicator** to manually advance the ratio if needed.
- **START / PAUSE / RESUME** controls the clock. **RESET GAME** resets the
  current game; confirm by tapping again within 3 seconds.

## Configuration

- **Teams:** choose a saved team or set each side's name and color; use
  **Manage Team List** to save, import, export, or delete teams.
- **Game clock:** set minutes per period and choose one game, two halves, or
  four quarters.
- **Gender ratio:** select an automatic, fixed, or custom/manual rule. The
  custom sequence uses `A` and `B`; set what each letter means with the Ratio A
  and Ratio B definitions.
- **Timer alert:** choose a sound, preview it with **TEST**, and set its volume.

Select **SAVE CONFIG** to apply and save your changes.

## Teams and JSON

In **⚙️ Settings → Manage Team List**, save teams for quick selection, delete
teams, or use **Export Teams**/**Import Teams**. Importing replaces the saved
team list, so export a copy first if needed.

A team file is JSON with a top-level `teams` array. Each team has an `id`, a
`name`, a `color` (RGB color written as a hex value), and a human-readable
`color_label` so people can identify the color at a glance. The app currently
requires `id`, `name`, and `color` to import a team; `color_label` is included
for clarity and may be omitted by the importer.

```json
{
  "teams": [
    {
      "id": 1,
      "name": "Crumbling Infrastructure",
      "color": "#ffffff",
      "color_label": "White"
    }
  ],
  "exportedAt": "2026-08-31T00:00:00.000Z",
  "version": "1.0"
}
```

See [`2026_FallLeague_teams_v1.json`](./2026_FallLeague_teams_v1.json) for a
full example. `exportedAt` and `version` are optional metadata.
