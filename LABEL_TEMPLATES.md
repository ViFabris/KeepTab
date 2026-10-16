# KeepTab label templates

All coordinates and dimensions below are in millimetres, measured from the label's landscape top-left corner. Every template reserves a 2 mm safe margin on all four sides. Text is fitted by shrinking within the listed range, wrapping up to the zone's line limit, and finally adding an ellipsis. No text may render below 8 pt.

The printer conversion is centralized in `src/printing/labelLayout.ts`: `dots = round(mm / 25.4 × dpi)`. The default is 203 dpi (about 8 dots/mm). Preview and print layouts resolve from these same zones. The print layout rotates the landscape design 90 degrees so its shorter side crosses the print head.

Legend: `I` item, `U` USE BY / VALIDADE, `M` made date, `S` maker name, `D` form/storage, `Q` QR code.

## Small — 50 × 30 mm

```text
┌──────────────────────────────────────────────────┐
│  ┌──────────── I 27×4.2 ───────────┐   ┌──────┐  │
│  ├────────── U label 27×3.4 ───────┤   │      │  │
│  ├────────── U value 27×5 ─────────┤   │ Q 16²│  │
│  ├────────── M label 27×3.4 ───────┤   │      │  │
│  ├────────── M value 27×3.4 ───────┤   └──────┘  │
│  └──────── maker name 27×6.6 ──────┘ ┌D 18×9 ┐  │
│                                      └────────┘  │
└──────────────────────────────────────────────────┘
```

| Zone | x, y | Size | Font | Lines | Alignment |
| --- | --- | --- | --- | --- | --- |
| Item | 2, 2 | 27 × 4.2 | 8–10 pt | 1 | left |
| USE BY label | 2, 6.2 | 27 × 3.4 | 8 pt | 1 | left |
| USE BY value | 2, 9.6 | 27 × 5 | 10–12 pt | 1 | left |
| Made label | 2, 14.6 | 27 × 3.4 | 8 pt | 1 | left |
| Made date | 2, 18 | 27 × 3.4 | 8 pt | 1 | left |
| Maker name | 2, 21.4 | 27 × 6.6 | 8 pt | 2 | left |
| Form/storage | 30, 19 | 18 × 9 | 8 pt | 2 | center |
| QR outer zone | 32, 2 | 16 × 16 | 1 mm quiet margin; 14 mm code | — | center |

The form/storage details use up to two lines at 8 pt. If unusually long custom details still do not fit and storage is Frozen, the zone becomes a snowflake symbol; otherwise it is omitted.

## Medium — 80 × 50 mm

```text
┌────────────────────────────────────────────────────────────┐
│  ┌────────────── I 52×10 ──────────────┐ ┌──────────────┐  │
│  ├────────────── D 52×4 ───────────────┤ │              │  │
│  ├────────── U label 52×3.5 ───────────┤ │    Q 22²     │  │
│  │            U value 52×11            │ │              │  │
│  ├────────── M label 52×3.5 ───────────┤ └──────────────┘  │
│  ├─────────── M value 52×5 ────────────┤                   │
│  └──────────────── S 76×7 ───────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

| Zone | x, y | Size | Font | Lines | Alignment |
| --- | --- | --- | --- | --- | --- |
| Item | 2, 2 | 52 × 10 | 10–15 pt | 2 | left |
| Form/storage | 2, 12.5 | 52 × 4 | 8–10 pt | 1 | left |
| USE BY label | 2, 17 | 52 × 3.5 | 8–9 pt | 1 | left |
| USE BY value | 2, 20.5 | 52 × 11 | 16–22 pt | 2 | left |
| Made label | 2, 32 | 52 × 3.5 | 8–9 pt | 1 | left |
| Made date/time | 2, 35.5 | 52 × 5 | 8–11 pt | 1 | left |
| Full staff name | 2, 41 | 76 × 7 | 8–11 pt | 2 | left |
| QR outer zone | 56, 3 | 22 × 22 | 1 mm quiet margin; 20 mm code | — | center |

## Large — 100 × 75 mm

```text
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────────────── I 66×15 ────────────────┐ ┌────────────────┐  │
│  ├──────────────── D 66×6 ─────────────────┤ │                │  │
│  ├──────────── U label 66×5 ───────────────┤ │     Q 28²      │  │
│  │              U value 66×17              │ │                │  │
│  ├──────────── M label 66×5 ───────────────┤ └────────────────┘  │
│  ├───────────── M value 66×7 ──────────────┤                     │
│  └──────────────────── S 96×9 ─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

| Zone | x, y | Size | Font | Lines | Alignment |
| --- | --- | --- | --- | --- | --- |
| Item | 2, 2 | 66 × 15 | 12–20 pt | 2 | left |
| Form/storage | 2, 18 | 66 × 6 | 8–13 pt | 1 | left |
| USE BY label | 2, 25 | 66 × 5 | 8–11 pt | 1 | left |
| USE BY value | 2, 30 | 66 × 17 | 22–32 pt | 2 | left |
| Made label | 2, 49 | 66 × 5 | 8–11 pt | 1 | left |
| Made date/time | 2, 54 | 66 × 7 | 8–13 pt | 1 | left |
| Full staff name | 2, 62 | 96 × 9 | 8–15 pt | 2 | left |
| QR outer zone | 70, 4 | 28 × 28 | 1 mm quiet margin; 26 mm code | — | center |

## Fit priorities

USE BY values always have a minimum font size larger than the maximum font size of every other field in the same template. The item, USE BY value, made date, maker name, and QR zone are always present. Small may replace only unusually long custom form/storage detail as described above. QR content is never smaller than 14 mm.
