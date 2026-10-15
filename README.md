# KeepTab

Offline-first food-storage label workflow for Android kitchen tablets. KeepTab is
built with Expo, React Native, TypeScript, and the tablet's local SQLite database.

> **Food-safety warning:** every bundled shelf-life duration is **PLACEHOLDER
> SAMPLE DATA — NOT VERIFIED FOR FOOD SAFETY**. Replace it with values reviewed
> for your operation before production use.

## What this version includes

- A first-launch language picker for **Português (Brasil)** or **English**. The
  choice is saved in SQLite and can be changed later from the sidebar.
- A low-tap flow for item, applicable storage, configurable form, staff member,
  preview, and print.
- 15 searchable sample items. Storage/form options and shelf lives are stored as
  separate normalized SQLite records.
- A `LabelPrinter` interface and `MockPrinter`. Mock printing shows the finished
  label and saves an active label record locally; it does not contact hardware.
- A Today board for overdue, due-today, and next-three-days labels, with Used and
  Thrown away actions.
- Local staff add/remove management. Existing labels retain the printed staff
  name even if that person is later removed.
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
code. The app locks itself to landscape and asks you to choose **Português
(Brasil)** or **English** on first launch. If the local network blocks device
discovery, stop Expo and use `npx expo start --tunnel` instead; the tunnel is only
for development delivery, not for the app's data.

Expo Go/Metro is the quickest development path and needs the computer to deliver
the JavaScript bundle. Once the bundle is running, all KeepTab data and behavior
are local. Clearing Expo Go's app data or uninstalling it also clears this
development database.

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
