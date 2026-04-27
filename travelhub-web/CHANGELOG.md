# Changelog — travelhub-web

Todos los cambios relevantes de la app web se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y la
versión usa [SemVer](https://semver.org/lang/es/) con el prefijo `travelhub-web-`.

Cada release publicado vive como un tag git `travelhub-web-vX.Y.Z` sobre `main`
y se asocia a una GitHub Release con el bundle de producción adjunto.

## [Unreleased]

> Notas pendientes de cortar como `vX.Y.Z` en el próximo merge a `main`.

## [0.1.0] — 2026-04-26

Primera versión etiquetada de la app web. Recoge todo el trabajo previo a
la implementación de la estrategia de versionado.

### Added
- Búsqueda y catálogo público de hoteles, detalle de hotel con
  disponibilidad por fechas, checkout completo con form de huésped y
  método de pago, pantalla de confirmación con código de reserva.
- Login + Signup (`/auth/login`, `/auth/register`) con persistencia de JWT
  en `localStorage`/`sessionStorage` según el flag "remember".
- Sesión de invitado: `X-Guest-Id` se persiste en `localStorage` y se
  envía en cada request anónima; cuando hay JWT, el header se manda
  vacío para que el backend respete el Bearer token (paridad con la app
  Android).
- Listado JWT-only de reservas en "Mis viajes" contra
  `/reservations/user`, con merge de las reservas locales por id (las
  del backend ganan en duplicados) y normalización del DTO al shape que
  ya rendereaba la card.
- Pre-fill del checkout con nombre / apellidos / email del usuario
  autenticado: los datos vienen del response de `/auth/login` y se
  persisten en storage; el form los renderiza `readOnly` (mismo trato
  que la pantalla de booking en Android).
- Cache local de reservas segmentado por identidad: clave
  `travelhub-reservations:user:<email>` cuando hay sesión y
  `travelhub-reservations:guest:<id>` cuando no, con migración one-shot
  de la clave legada `travelhub-reservations`.
- Portal hotelero: dashboard de analíticas, listado y detalle de
  reservas, gestión de check-in.
- Tests unitarios con Vitest cubriendo `services/api.js`,
  `auth/sessionAuth.js`, `bookings/localReservations.js`,
  `bookings/bookingDetailSlug.js` y `components/checkout/GuestForm.jsx`.
- Pruebas E2E con Playwright (`e2e/`) para los flujos de login y signup.
- Gate de cobertura del 80% (líneas/statements/functions) sobre la capa
  lógica, aplicado en CI vía `npm run test:coverage`.

### Changed
- `loginUser` expone explícitamente `first_name`, `last_name` y `email`
  del response del backend. `persistSessionFromLogin` los guarda en
  `localStorage` junto al token, role y user_type.

### Fixed
- `X-Guest-Id` ya no contamina llamadas autenticadas (se enviaba el id
  del invitado heredado de búsquedas anónimas previas mientras el
  usuario ya estaba logueado).
- "Mis viajes" ya no muestra las reservas de un usuario distinto al
  iniciar sesión en otro navegador / cuenta; cada identidad tiene su
  propio scope en `localStorage`.

[Unreleased]: https://github.com/jjpenad/Travelhub-frontend/compare/travelhub-web-v0.1.0...HEAD
[0.1.0]: https://github.com/jjpenad/Travelhub-frontend/releases/tag/travelhub-web-v0.1.0
