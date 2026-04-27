# Releasing — TravelHub frontend monorepo

Cada app cliente publica versiones independientes siguiendo
[SemVer](https://semver.org/lang/es/) y la estrategia documentada en el wiki
del equipo (resumen abajo). Esta guía es la receta operativa para cortar un
release sin tener que recordar comandos.

## Ramas y flujo

```
feature/* ──▶ develop ──▶ (PR) ──▶ main ──▶ tag travelhub-{web|mobile}-vX.Y.Z
                                    ▲
                                hotfix/* ──▶ (PR) ──▶ main ──▶ tag patch
```

- `develop` es siempre la base estable de integración. Las features
  llegan vía PR con su feature branch.
- `main` se actualiza solo via PR desde `develop` (o `hotfix/*`).
- El tag se crea en `main` después del merge — nunca en `develop`.
- Tag = trigger del release: `Frontend CI` (web) y `Mobile CI` (mobile)
  reaccionan al patrón `travelhub-{web,mobile}-v*` y adjuntan el bundle
  / APK al GitHub Release correspondiente.

## Cortar un release de `travelhub-web`

```bash
# 1. asegurar develop está mergeado a main
git checkout main
git pull origin main

# 2. confirmar que CHANGELOG.md tiene la sección [X.Y.Z] poblada
#    (mover entradas de [Unreleased] al nuevo encabezado de versión).

# 3. bump de package.json (alineado con el tag que vas a crear)
#    edita travelhub-web/package.json → "version": "X.Y.Z"
#    y refresca el lockfile sin tocar deps:
cd travelhub-web && npm install --package-lock-only && cd ..
git add travelhub-web/package.json travelhub-web/package-lock.json travelhub-web/CHANGELOG.md
git commit -m "chore(web): release X.Y.Z"
git push origin main

# 4. crear y empujar el tag — el mensaje referencia la HU principal
git tag -a travelhub-web-vX.Y.Z -m "Release X.Y.Z — WEB-FXX-HUYY"
git push origin travelhub-web-vX.Y.Z
```

El push del tag dispara el workflow `Frontend CI`, que:

1. Corre lint + tests + coverage gate (80%).
2. Hace `npm run build`, empaqueta `dist/` como `travelhub-web-dist.zip`.
3. Crea la GitHub Release `travelhub-web-vX.Y.Z` (si no existe) y adjunta
   el zip.
4. Amplify detecta el push a `main` (que ya pasó en el paso 3) y publica
   el bundle en el dominio de producción.

## Cortar un release de `travelhub-mobile`

```bash
git checkout main
git pull origin main

# CHANGELOG: mueve [Unreleased] → [X.Y.Z]
# Bump opcional de versionName/versionCode en travelhub-mobile/app/build.gradle.kts
git add travelhub-mobile/CHANGELOG.md travelhub-mobile/app/build.gradle.kts
git commit -m "chore(mobile): release X.Y.Z"
git push origin main

git tag -a travelhub-mobile-vX.Y.Z -m "Release X.Y.Z — MOB-FXX-HUYY"
git push origin travelhub-mobile-vX.Y.Z
```

`Mobile CI` toma el tag, hace `assembleDebug` (firmado con la
`debug.keystore` que Gradle genera automáticamente — suficiente para
instalar el APK en cualquier dispositivo o emulador, no apto para Play
Store) y lo adjunta al GitHub Release `travelhub-mobile-vX.Y.Z`.

## Hotfix

```bash
git checkout -b hotfix/<descripcion> main
# … fixes …
git commit -am "fix: …"
git push -u origin hotfix/<descripcion>
# PR a main, mergear, taggear con vX.Y.(Z+1) siguiendo los pasos de arriba.
# Después abrir un PR desde main → develop para que el fix vuelva a la
# rama de integración.
```

## Tabla de tag ↔ deploy

| Acción | Tag | Entorno |
|---|---|---|
| Merge feature → `develop` | — | Staging Amplify (si está conectado) |
| Merge `develop` → `main` + tag web | `travelhub-web-vX.Y.Z` | Producción Amplify + GitHub Release |
| Merge `develop` → `main` + tag mobile | `travelhub-mobile-vX.Y.Z` | GitHub Release con APK firmado |
| Hotfix sobre `main` | `travelhub-{app}-vX.Y.(Z+1)` | Igual que el merge normal |

## Reglas no negociables

- Nunca taggear `develop` ni feature branches.
- El tag debe apuntar a un commit que ya pasó por PR (no permite commits
  directos a `main`; se asume branch protection en GitHub).
- El cuerpo del tag (`-m`) referencia la(s) HU principal(es) del release.
- Antes de crear el tag, mover las entradas de `## [Unreleased]` del
  changelog al encabezado nuevo `## [X.Y.Z] — YYYY-MM-DD`.
- Variables sensibles (URLs API, tokens) viven en consola de Amplify y
  como secretos del repo de GitHub — nunca en el código ni en los tags.
