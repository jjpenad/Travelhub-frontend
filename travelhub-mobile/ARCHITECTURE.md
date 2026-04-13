# TravelHub Mobile — Architecture

## Overview

TravelHub Mobile follows **Clean Architecture** with **MVVM** in the presentation layer. The app is built entirely with **Jetpack Compose** and uses **StateFlow** for reactive state management.

## Architectural Migration: Fragments to Compose

The original architecture diagram specified **Fragments + LiveData + XML layouts**, which was the standard Android approach until 2021. We migrated to **Compose + StateFlow** for the following reasons:

### Why Compose over Fragments + XML

| Aspect | Fragments + XML (Original) | Compose (Current) |
|---|---|---|
| **UI definition** | XML layout files + Fragment classes | `@Composable` functions |
| **Files per screen** | 3+ (Fragment.kt + layout.xml + adapter if list) | 1 (Screen.kt) |
| **State observation** | `LiveData.observe(viewLifecycleOwner)` | `collectAsStateWithLifecycle()` |
| **Navigation** | Fragment transactions / Navigation Component | Navigation Compose |
| **Lifecycle management** | Manual (`onCreateView`, `onDestroyView`) | Automatic (Composition lifecycle) |
| **Status** | Maintenance mode | Actively developed by Google |

### Why StateFlow over LiveData

| Aspect | LiveData | StateFlow |
|---|---|---|
| **Origin** | Android-specific (requires Android dependencies) | Kotlin standard library |
| **Unit testing** | Needs `InstantTaskExecutorRule` workaround | Works natively with `runTest` |
| **Operators** | Limited (`map`, `switchMap`) | Full Flow operators (`map`, `combine`, `filter`, `debounce`, etc.) |
| **Compose integration** | `observeAsState()` (bridge API) | `collectAsStateWithLifecycle()` (native) |
| **Null safety** | Nullable by default | Non-null with initial value via `MutableStateFlow(initialValue)` |

### What Stayed the Same

The migration only affected the **presentation layer**. Everything below it is identical to the original diagram:

- **ViewModels** — same role, same lifecycle, same Hilt injection
- **Use Cases** — unchanged single-responsibility classes with `operator fun invoke()`
- **Repository interfaces** — identical contracts
- **Repository implementations** — same data source delegation
- **Entities/Models** — identical data classes
- **Hilt DI** — same module structure

This is the key benefit of Clean Architecture: swapping the UI framework required zero changes to business logic or data layers.

## Layer Details

### Presentation Layer (`ui/`)

```
ui/
├── theme/           # Material 3 theme (colors, typography, shapes)
├── navigation/      # Single NavHost with sealed Screen routes + BottomNavBar
├── components/      # Reusable composables shared across screens
└── screens/         # Feature-grouped screens, each with:
    └── feature/
        ├── FeatureScreen.kt      # Composable UI
        └── FeatureViewModel.kt   # @HiltViewModel with StateFlow
```

**Pattern per screen:**

Each screen follows a consistent pattern to enable previews without ViewModels:

```kotlin
// The public screen function takes a ViewModel
@Composable
fun FeatureScreen(viewModel: FeatureViewModel, ...) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    FeatureContent(state = state, onAction = viewModel::doSomething)
}

// The private content function takes plain data — used by both screen and preview
@Composable
private fun FeatureContent(state: UiState, onAction: () -> Unit) {
    // All UI code here
}

// Preview calls content directly with mock data
@Preview
@Composable
private fun FeatureScreenPreview() {
    TravelHubTheme {
        FeatureContent(state = mockState, onAction = {})
    }
}
```

**State management pattern:**

Each ViewModel exposes a sealed interface for UI state:

```kotlin
sealed interface FeatureUiState {
    object Loading : FeatureUiState
    data class Success(val data: Data) : FeatureUiState
    data class Error(val message: String) : FeatureUiState
}
```

### Domain Layer (`domain/`)

```
domain/
├── model/           # Plain Kotlin data classes (no Android dependencies)
├── repository/      # Interfaces defining data contracts
└── usecase/         # Single-purpose business logic classes
```

- **Models** are pure Kotlin — no Room annotations, no Gson annotations
- **Repository interfaces** define the contract; implementations live in `data/`
- **Use cases** have a single `operator fun invoke()` method, keeping ViewModels thin

### Data Layer (`data/`)

```
data/
├── mock/            # Static mock data objects (to be removed when backend is ready)
├── local/
│   ├── TravelHubDatabase.kt    # Room database
│   ├── dao/                     # Room DAOs
│   ├── entity/                  # Room entities with annotations
│   └── UserPreferences.kt      # DataStore wrapper for session
├── remote/api/      # Retrofit interface stubs (commented, ready to uncomment)
├── mapper/          # Extension functions: Entity.toDomain(), Domain.toEntity()
└── repository/      # Implementations backed by mock data + Room
```

**Current data flow (mock):**

```
ViewModel → UseCase → Repository(Interface) → RepositoryImpl → MockData/Room
```

**Target data flow (with backend):**

```
ViewModel → UseCase → Repository(Interface) → RepositoryImpl → API + Room cache
```

The switch requires only editing `RepositoryImpl` classes. Search for `TODO(backend)` to find every integration point.

### DI Layer (`di/`)

```
di/
├── AppModule.kt          # @Provides: DataStore, Room database, Room DAOs
│                          # TODO: Retrofit, OkHttpClient, API interfaces
└── RepositoryModule.kt   # @Binds: Repository interfaces → implementations
```

## Navigation Architecture

Single-Activity architecture with `NavHost`:

```
MainActivity (@AndroidEntryPoint)
└── Scaffold
    ├── BottomNavBar (visible on: Home, Search, MyTrips, Profile)
    └── NavHost
        ├── Login → SignUp
        ├── Home (tab)
        ├── Search (tab) → Results → PropertyDetail → BookingPayment → BookingConfirmation
        ├── MyTrips (tab) → TripDetails → QRCheckIn
        ├── Profile (tab)
        └── Notifications
```

- Bottom nav uses `popUpTo` + `saveState`/`restoreState` for proper back stack per tab
- Auth flow clears back stack on login success (`popUpTo(Login) { inclusive = true }`)
- Booking confirmation clears back to Home (`popUpTo(Home)`)

## Backend Integration Checklist

All integration points are marked with `TODO(backend)` in the codebase. Summary:

1. **`AppModule.kt`** — Add Retrofit singleton with auth interceptor, provide API interfaces
2. **`AuthRepositoryImpl.kt`** — Replace `MockUsers` with `AuthApi.login()`, add token refresh
3. **`PropertyRepositoryImpl.kt`** — Replace `MockProperties` with `PropertyApi` + Room cache
4. **`BookingRepositoryImpl.kt`** — Remove mock seeding, use `BookingApi` + local Room sync
5. **`PaymentRepositoryImpl.kt`** — Integrate payment gateway (Stripe SDK or similar)
6. **`CheckinRepositoryImpl.kt`** — Use server-signed QR tokens instead of client-generated
7. **`NotificationRepositoryImpl.kt`** — Fetch from API + integrate Firebase Cloud Messaging
8. **`BookingViewModel.kt`** — Get real user ID from session, dates from search flow
9. **`SignUpScreen.kt`** — Wire to `AuthApi.signUp()`, add social auth (Google/Apple)
10. **`ProfileSettingsScreen.kt`** — Load real user profile, make settings functional
11. **`AndroidManifest.xml`** — Uncomment FCM service, add required permissions

## Permissions Checklist

Marked with `TODO(permissions)` in the codebase:

| Permission | When Needed | Runtime Request Required |
|---|---|---|
| `POST_NOTIFICATIONS` | Push notifications (Android 13+) | Yes |
| `CAMERA` | QR code scanning (if added) | Yes |
| `ACCESS_FINE_LOCATION` | Map/nearby hotels feature | Yes |
| `ACCESS_COARSE_LOCATION` | Approximate location for search | Yes |

## Testing Strategy

| Layer | Tool | What's Tested |
|---|---|---|
| Use Cases | JUnit + MockK | Business logic, input validation |
| Repositories | JUnit + MockK | Data mapping, mock delegation, Room DAO calls |
| ViewModels | JUnit + MockK + Coroutines Test | State transitions (Idle → Loading → Success/Error) |
| Mappers | JUnit | Entity ↔ Domain round-trip fidelity |
| UI (future) | Compose UI Test + Hilt Testing | Screen rendering, navigation flows |
