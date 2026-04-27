# Changelog — travelhub-mobile

Cambios relevantes de la app Android. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la versión usa
[SemVer](https://semver.org/lang/es/) con el prefijo `travelhub-mobile-`.

Cada release publicado vive como un tag git `travelhub-mobile-vX.Y.Z` sobre
`main`. El workflow `Mobile CI` adjunta el APK firmado a la GitHub Release
correspondiente cuando detecta el tag.

## [Unreleased]

> Notas pendientes de cortar como `vX.Y.Z` en el próximo merge a `main`.

## [0.1.0] — 2026-04-26

Primera versión etiquetada de la app móvil. Recoge todo el trabajo previo a
la implementación de la estrategia de versionado.

### Added
- Flujos completos: búsqueda y reserva anónima, signup / login,
  vinculación de reservas anónimas a la cuenta nueva por email,
  logout, reset del guest session id desde Profile, login de usuario
  existente.
- Self check-in vía QR firmado con HMAC-SHA256 + diálogo informativo
  con el payload decodificado y `Complete Check-In` (PATCH del estado
  contra el backend).
- "My Trips" autenticado contra `/reservations/user` con
  pull-to-refresh, paginación infinita y `OnResumeEffect` para
  refrescar al volver de una sub-pantalla.
- Suite de pruebas unitarias con cobertura ≥80% (Kover) sobre la capa
  testable (ViewModels, Repositories, UseCases) — el gate está en CI
  vía `./gradlew koverVerify`.
- Suite de E2E con Maestro (8 flows) — corre on-demand desde el
  workflow `Mobile E2E`.
- Listado autenticado correctamente scopeado por `user_id` del JWT
  (no por el guest session id heredado de búsquedas anónimas previas).

### Fixed
- `BookingRepositoryImpl` ya no pierde el flag local `isCheckedIn` al
  refrescar tras un check-in: ahora prefiere el `userId` del usuario
  autenticado sobre el `guestSessionId` para escoger el scope local,
  evitando que `deleteByUserIdNot` borre la fila recién marcada.
- `SignUpScreen` y `LoginScreen` reflowean el contenido cuando aparece
  el IME (`Modifier.imePadding()` + `WindowCompat.setDecorFitsSystemWindows(false)`),
  para que ningún campo quede atrapado bajo el teclado en pantallas
  pequeñas. `BookingPaymentScreen` recibe el mismo tratamiento.
- `TravelHubTextField` ahora usa el slot `label` nativo de
  `OutlinedTextField`, así Maestro / TalkBack pueden focalizar el
  input tapeando su etiqueta.

[Unreleased]: https://github.com/jjpenad/Travelhub-frontend/compare/travelhub-mobile-v0.1.0...HEAD
[0.1.0]: https://github.com/jjpenad/Travelhub-frontend/releases/tag/travelhub-mobile-v0.1.0
