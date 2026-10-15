# KeepTab

Offline-first food-storage label workflow for Android kitchen tablets. KeepTab is
built with Expo, React Native, TypeScript, and the tablet's local SQLite database.

> **Food-safety warning:** every bundled shelf-life duration is **PLACEHOLDER
> SAMPLE DATA — NOT VERIFIED FOR FOOD SAFETY**. Replace it with values reviewed
> for your operation before production use.

## What this version includes

- A six-step first-run setup for language/date preferences, typed label size,
  staff, a 4–6 digit admin PIN, storage/form options, and an on-screen test
  print. Setup completion is stored in SQLite and is not shown again.
- Immediate switching between **Português (Brasil)** and **English**, including
  during setup. Date order, 12/24-hour time, and spelled month abbreviations are
  configurable.
- A low-tap flow for item, applicable storage, configurable form, staff member,
  preview, and print.
- 15 searchable sample items. Storage/form options and shelf lives are stored as
  separate normalized SQLite records. Option IDs stay stable when their display
  names change.
- A `LabelPrinter` interface and `MockPrinter`. Mock printing shows the finished
  label and saves an active label record locally; test prints are preview-only
  and do not enter the Today list. No hardware printer is contacted.
- A Today board for overdue, due-today, and next-three-days labels, with Used and
  Thrown away actions.
- PIN-protected settings for all setup choices, test printing, and staff
  management. The ordinary label flow can select staff but cannot edit them.
- Local staff add/remove management. Existing labels retain the printed staff
  name even if that person is later removed. The PIN is salted and hashed; its
  credentials use Android secure storage when available, with SQLite as the
  offline fallback.
- Landscape orientation, large touch targets, high contrast, and no server,
  account, API key, or network request.

## Run it on an Android tablet with Expo Go

### Computer setup

1. Install [Node.js LTS](https://nodejs.org/) version **22.13 or newer**. Node 24
   LTS also works. npm is included with Node.
2. Install [Expo Go from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   on the Android tablet.
3. Put the computer and tablet on the same Wi-Fi network.

Then run exactly:

```bash
cd /Users/vicente/Desktop/KeepTab
npm ci
npm run check
npx expo start
```

Open Expo Go on the tablet, choose **Scan QR code**, and scan the terminal's QR
code. The app locks itself to landscape and opens the setup wizard on first
launch. Choose the language first; the remaining setup text changes immediately.
If the local network blocks device discovery, stop Expo and use
`npx expo start --tunnel` instead; the tunnel is only for development delivery,
not for the app's data.

Expo Go/Metro is the quickest development path and needs the computer to deliver
the JavaScript bundle. Once the bundle is running, all KeepTab data and behavior
are local. Clearing Expo Go's app data or uninstalling it also clears this
development database.

## First run and administration

Complete all six setup steps, then tap **Looks good / Parece bom**. The main
screen keeps only the label workflow and Today board. Use the gear in the lower
left and enter the admin PIN to change preferences, label dimensions, staff,
storage/form options, the PIN, or run another test print.

There is intentionally no PIN recovery flow in this local-only version. If the
PIN is forgotten, reset the app's storage in Android Settings (or clear Expo
Go's app data during development) and run setup again. This removes the local
KeepTab database, including staff and label history, so do not do it casually.

Existing databases are upgraded in place when the app opens. The migration adds
settings, stable option IDs, and saved label dimensions while retaining existing
staff, printed labels, statuses, and shelf-life rows.

## Run in an Android emulator

Install Android Studio, an Android SDK Platform 36 image, and create a landscape
tablet emulator. Start the emulator, then run:

```bash
cd /Users/vicente/Desktop/KeepTab
npm ci
npm run android
```

You can also start with `npx expo start` and press `a` in the terminal.

## Install a standalone local release for offline testing

For an app that launches without Expo Go or Metro, install Android Studio and its
bundled JDK, install Android SDK Platform 36, enable Developer options and USB
debugging on the tablet, connect it by USB, and verify that `adb devices` lists it.
Then run:

```bash
cd /Users/vicente/Desktop/KeepTab
npm ci
npx expo run:android --variant release --device
```

Expo generates the native Android project locally, builds a release-mode app,
lets you select the connected device, and installs it. This local release is for
device testing and is not signed for Play Store submission. A distributable
production build should get a proper package identifier, icon, versioning, and
release signing before rollout.

## Shelf-life data

The seed file is [`src/data/sample-data.json`](src/data/sample-data.json). Each
shelf-life row is keyed by item + form + storage type and carries a `placeholder`
flag. If a chosen combination has no row, the preview says so and disables Print
instead of deriving or guessing a value.

When replacing the sample values:

1. Set each checked row's `placeholder` to `false` and add a non-empty
   `sourceNote` to that row.
2. Increase the top-level `seedVersion` so existing tablet databases receive the
   changed values on next launch.
3. Have the resulting data and displayed date rules reviewed before kitchen use.

Dates are stored as UTC ISO timestamps. The use-by timestamp is calculated as
the made timestamp plus the configured number of shelf-life hours; display uses
the tablet's local timezone.

## Useful commands

```bash
npm start          # Start Expo/Metro
npm run android    # Start Expo and open Android
npm run typecheck  # TypeScript only
npm test           # Unit tests
npm run check      # TypeScript and tests
```

The code is organized under `src/screens`, `src/database`, `src/printing`,
`src/components`, `src/data`, and `src/utils`.
