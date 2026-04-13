# TravelHub Mobile

Android mobile app for TravelHub — a travel booking platform for searching hotels, making reservations, managing trips, and performing QR check-ins.

## Tech Stack

- **Language:** Kotlin
- **UI:** Jetpack Compose + Material 3
- **Architecture:** Clean Architecture + MVVM
- **DI:** Hilt
- **Navigation:** Navigation Compose
- **Local Storage:** Room (bookings), DataStore (user session)
- **State Management:** StateFlow + collectAsStateWithLifecycle
- **QR Generation:** ZXing
- **Image Loading:** Coil (ready, used when backend provides image URLs)
- **Networking:** Retrofit + OkHttp (stubs ready for backend integration)
- **Testing:** JUnit 4, MockK, Turbine, Coroutines Test

## Requirements

- Android Studio Hedgehog or newer
- JDK 17
- Android SDK 34
- Min SDK 24 (Android 7.0)

## Getting Started

1. Clone the repository
2. Open the `travelhub-mobile` folder in Android Studio
3. Sync Gradle (File > Sync Project with Gradle Files)
4. Run on emulator or device

## Login

Currently using mock data. Use these credentials:

- **Email:** `admin`
- **Password:** `admin`

## Screens

| Screen | Description |
|---|---|
| Login | Email/password auth with social login buttons |
| Sign Up | Registration form with password strength indicator |
| Home | Featured destinations, popular this week, top stays |
| Search | Destination, dates, guests, advanced filters |
| Results | Filtered hotel list with ratings and prices |
| Property Detail | Hotel info, amenities, reviews, reserve button |
| Booking Payment | Summary, payment method, price breakdown |
| Booking Confirmation | Success state with booking reference |
| My Trips | Upcoming/past tabs with booking cards |
| Trip Details | Check-in/out dates, booking ref, hotel contact |
| QR Check-In | Generated QR code for front desk check-in |
| Profile & Settings | Account info, language, currency, preferences |
| Notifications | Booking updates, reminders, payment receipts |

## Project Structure

```
com.example.travelhub/
├── di/                  # Hilt modules (AppModule, RepositoryModule)
├── domain/
│   ├── model/           # Data classes (Property, Booking, UserSession, etc.)
│   ├── repository/      # Repository interfaces
│   └── usecase/         # Business logic (LoginUseCase, CreateBookingUseCase, etc.)
├── data/
│   ├── mock/            # Mock data (properties, bookings, users, notifications)
│   ├── local/           # Room database, DAOs, DataStore preferences
│   ├── remote/api/      # Retrofit API interface stubs
│   ├── mapper/          # Entity <-> Domain mappers
│   └── repository/      # Repository implementations
└── ui/
    ├── theme/           # Colors, typography, shapes, theme
    ├── navigation/      # NavGraph, Screen routes, BottomNavBar
    ├── components/      # Reusable composables (buttons, text fields, cards)
    └── screens/         # Feature screens organized by domain
```

## Testing

```bash
# Run unit tests
./gradlew testDebugUnitTest

# Build debug APK
./gradlew assembleDebug
```

19 unit tests covering:
- Use cases (LoginUseCase, SearchPropertiesUseCase)
- Repositories (AuthRepositoryImpl, BookingRepositoryImpl)
- ViewModels (AuthViewModel)
- Mappers (BookingEntity <-> Booking round-trip)

## Backend Integration

The app uses mock data but is fully prepared for backend integration. Search for `TODO(backend)` in the codebase to find all integration points. See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Architecture decisions, Compose migration rationale, layer details
