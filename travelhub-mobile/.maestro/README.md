# TravelHub Mobile · Maestro E2E

End-to-end tests written in [Maestro](https://maestro.mobile.dev) YAML.

## Why Maestro

The app is native Kotlin + Jetpack Compose. Maestro:

- Drives the real APK from outside (no source coupling, no test tags required).
- YAML-first → fast to write and review.
- Cross-platform (works on iOS too if/when the project grows).
- First-class CI integration via Maestro Cloud or self-hosted on emulators.

For component-level Compose UI tests we keep using the standard
`androidx.compose.ui:ui-test-junit4` setup; Maestro handles the
"black-box, full app" layer.

## Flows

| File | Scenario |
|------|----------|
| `01_anonymous_booking.yaml`         | Guest books without an account — confirms the X-Guest-Id path works end-to-end. |
| `02_signup_new_user.yaml`           | Brand-new user goes from anonymous to authenticated via the signup form. |
| `03_link_anonymous_to_account.yaml` | The marquee scenario: book anonymously with email X, then sign up with the same email — backend `_link_guest_reservations` migrates the booking and it appears in My Trips. |
| `04_logout.yaml`                    | Authenticated user logs out from Profile and lands back on the anonymous state. |
| `05_reset_guest_session.yaml`       | Anonymous user resets their X-Guest-Id from Profile. |
| `06_login_existing_user.yaml`       | Existing user signs in (registers + logs out + logs back in). Distinct path from signup. |
| `07_email_exists_dialog.yaml`       | Sign up with a duplicate email surfaces the "already registered" error from the 409 branch. |
| `08_qr_checkin_flow.yaml`           | Book → open QR → tap info icon (verify decoded payload) → Complete Check-In → reservation flips to "Checked in". |

`utils/unique_email.js` generates a fresh email per run so the same
test file can run repeatedly without colliding on the backend's unique
email constraint.

## Running locally

### Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
# or via Homebrew on macOS:
brew tap mobile-dev-inc/tap && brew install maestro
```

### Build and install the debug APK

```bash
# From repo root:
cd travelhub-mobile
./gradlew installDebug
```

### Run a single flow

```bash
# From inside travelhub-mobile/:
maestro test .maestro/01_anonymous_booking.yaml
```

### Run all flows

```bash
# From inside travelhub-mobile/:
maestro test .maestro/
```

> The flows live at `travelhub-mobile/.maestro/`. Run Maestro from inside
> `travelhub-mobile/` so the relative path resolves cleanly. From the repo
> root, point at `travelhub-mobile/.maestro/` instead.

### Useful flags

- `--debug-output ./out` — saves screenshots + logs of each step to `./out`.
- `--continuous` — re-runs on file save (great for iterating on a flow).
- `-e API_BASE=https://...` — pass env vars into a flow.

## Running on CI

There is a sample workflow at `.github/workflows/mobile-e2e.yml`
(if/when you enable it) that:

1. Builds the debug APK with Gradle.
2. Boots an Android emulator using `reactivecircus/android-emulator-runner`.
3. Installs the APK and the Maestro CLI.
4. Runs `maestro test .maestro/`.

Tests run against the **dev backend** (the same URL the app is configured
against in `AppModule.BASE_URL`). For deterministic CI runs you'd point
the emulator at a staging or mocked backend instead — that's a follow-up.

## Conventions used in these flows

- **`clearState` at the start of every flow** so state from a previous
  test (e.g. a JWT in DataStore) doesn't leak.
- **`extendedWaitUntil`** for assertions that depend on a network
  roundtrip (15s timeout for the booking confirmation, 10s for list
  refresh, etc.).
- **Optional steps** wrapped in `runFlow:when:` blocks so a flow doesn't
  break when a screen variant differs slightly.
- **Regex matchers** (`text: ".*RES[A-Z0-9]+.*"`) for content the backend
  generates dynamically (confirmation codes, session ids).

## Adding a new flow

1. Pick a self-contained scenario; write the goal, pre/post-conditions
   and the steps as comments at the top of the YAML.
2. Generate a unique email if the flow signs up: include
   `runScript: file: utils/unique_email.js` first.
3. Always start with `clearState` + `launchApp`.
4. Avoid leaning on screenshots — assertions on `text` / `visible`
   selectors are easier to maintain.

## Known limitations

- The system date picker (Compose's `DatePickerDialog`) is hard to drive
  from Maestro reliably. The flows lean on the default check-in /
  check-out values from `SearchViewModel` (today + 7d / today + 11d).
  If those defaults change, the flows still work as long as the dates
  remain valid for the backend.
- `link_anonymous_to_account` depends on the backend's
  `_link_guest_reservations` handler. If the dev backend disables that,
  flow 03 will fail at the final assertion.
