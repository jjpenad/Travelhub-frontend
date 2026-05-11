plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("org.jetbrains.kotlin.kapt")
    id("org.jetbrains.kotlinx.kover")
    // Procesa `app/google-services.json` y registra el FirebaseApp default
    // al iniciar la app. Si el archivo no existe el build FALLA — por eso
    // sólo agregar esta línea cuando `google-services.json` esté en su sitio.
    id("com.google.gms.google-services")
}

android {
    namespace = "com.example.travelhub"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.travelhub"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // BASE_URL del backend en producción (AWS dev cluster). Si
            // sale un cluster prod separado, sobrescribir aquí o usar
            // un `productFlavors` por entorno.
            buildConfigField(
                "String",
                "BASE_URL",
                "\"http://k8s-travelhubdev-3d982ad1bb-1106876598.us-east-2.elb.amazonaws.com/\""
            )
        }
        debug {
            // En debug apuntamos al host local para que el emulador
            // alcance al backend que corre en `localhost:8000` del
            // dev. `10.0.2.2` es la IP loopback que el emulador Android
            // mapea automáticamente al host. Para device físico, cambia
            // a la IP del host en la LAN (ver `RUNNING_LOCALLY.md`).
            buildConfigField(
                "String",
                "BASE_URL",
                "\"http://10.0.2.2:8000/\""
            )
        }
    }
    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        // Necesario para acceder a `BuildConfig.VERSION_NAME` desde el
        // FcmTokenSync / FirebaseMessagingService (lo enviamos al backend
        // como `app_version` al registrar el device token).
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.4.3"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    // Make Android SDK stubs return defaults (e.g. android.util.Log) in JVM unit tests
    // instead of throwing "Method not mocked". Saves us from mocking Log in every test.
    testOptions {
        unitTests {
            isReturnDefaultValues = true
        }
    }
}

kapt {
    correctErrorTypes = true
}

// Kover — code coverage. CI runs `./gradlew koverXmlReport koverHtmlReport koverVerify`.
// Threshold: 80% line coverage applied to the *testable* layer (data + domain + VMs).
// Compose UI, navigation graphs and theme are excluded because they require instrumented
// tests (Robolectric / Compose UI tests) which don't run in this JVM-only pipeline.
kover {
    reports {
        verify {
            rule {
                minBound(80)
            }
        }
        filters {
            excludes {
                classes(
                    // ── Generated / framework boilerplate ───────────────────────
                    "*.BuildConfig",
                    "*.databinding.*",
                    "*.R",
                    "*.R\$*",
                    // Hilt
                    "*_Hilt*",
                    "Hilt_*",
                    "*_Factory",
                    "*_Factory\$*",
                    "*_MembersInjector",
                    "dagger.hilt.internal.*",
                    "hilt_aggregated_deps.*",
                    // Compose tooling
                    "*ComposableSingletons*",
                    "*\$Companion",

                    // ── App-side exclusions ────────────────────────────────────
                    // DI modules — almost entirely @Provides plumbing
                    "com.example.travelhub.di.*",
                    // Compose UI: screens, components, navigation, theme — these
                    // need Compose UI tests / Robolectric, not JVM unit tests.
                    "com.example.travelhub.ui.components.*",
                    "com.example.travelhub.ui.navigation.*",
                    "com.example.travelhub.ui.theme.*",
                    "com.example.travelhub.ui.screens.*Screen*",
                    "com.example.travelhub.ui.screens.*ScreenKt*",
                    "com.example.travelhub.MainActivity*",
                    "com.example.travelhub.TravelHubApp*",
                    // Mock data fixtures (not production logic)
                    "com.example.travelhub.data.mock.*",
                    // DTOs / Entities are pure data carriers (Gson / Room handle them)
                    "com.example.travelhub.data.remote.dto.*",
                    "com.example.travelhub.data.local.entity.*",
                    // ConnectivityObserver wraps Android ConnectivityManager + NetworkCallback;
                    // it can't be exercised meaningfully without Robolectric / instrumented tests.
                    "com.example.travelhub.data.network.ConnectivityObserver*",
                    // Retrofit interfaces have no implementation to cover — they're metadata.
                    "com.example.travelhub.data.remote.api.*",
                    // Room DAO interfaces compile to auto-generated *_Impl classes that bind
                    // SQLite calls — only exercisable via instrumented / Robolectric tests.
                    "com.example.travelhub.data.local.dao.*",
                    "com.example.travelhub.data.local.dao.*_Impl*",
                    "*_Impl",
                    "*_Impl\$*",
                    // Room database abstract class — Room generates the impl at build time.
                    "com.example.travelhub.data.local.TravelHubDatabase*",
                    // Application + MainActivity are wiring-only (Hilt + Compose entry points)
                    // and are exercised by instrumented tests, not JVM units.
                    "com.example.travelhub.MainActivity",
                    "com.example.travelhub.MainActivity\$*",
                    "com.example.travelhub.TravelHubApp",
                    "com.example.travelhub.ComposableSingletons*",
                    // Notification dispatcher + permission gate: thin wrappers around
                    // ContextCompat / NotificationManagerCompat / ActivityResultLauncher.
                    // Validated on device; the testable logic lives in NotificationsViewModel.
                    "com.example.travelhub.notifications.AndroidPostNotificationsPermissionGate*",
                    "com.example.travelhub.notifications.AndroidNotificationDispatcher*",
                    // FCM service + helpers que tocan FirebaseMessaging directamente:
                    // requieren Firebase initialization para correr y solo se exercise en
                    // device. La lógica de orquestación (DeviceTokenRepositoryImpl) sí
                    // queda dentro de Kover.
                    "com.example.travelhub.notifications.TravelHubFirebaseMessagingService*",
                    "com.example.travelhub.notifications.TravelHubFirebaseMessagingServiceKt*",
                    "com.example.travelhub.notifications.FcmTokenSyncImpl*"
                )
            }
        }
    }
}

dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.0")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    // Material 1 just for the experimental pull-to-refresh API; everything else is Material3.
    implementation("androidx.compose.material:material")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.6.2")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.44")
    kapt("com.google.dagger:hilt-android-compiler:2.44")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Room
    implementation("androidx.room:room-runtime:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")
    kapt("androidx.room:room-compiler:2.6.0")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coil (image loading)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // ZXing (QR code generation)
    implementation("com.google.zxing:core:3.5.2")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Firebase Cloud Messaging — la lib lincada viaja siempre; el plugin
    // `com.google.gms.google-services` se aplica recién cuando el equipo
    // deje un `google-services.json` real en `app/`. Sin ese archivo, FCM
    // queda inactivo en runtime (logs de warning en LogCat) pero la app
    // compila + corre + los tests del DeviceTokenRepository pasan, porque
    // toda la lógica de negocio depende solo del cliente Retrofit.
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Core Library Desugaring
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("app.cash.turbine:turbine:1.0.0")
    testImplementation("androidx.arch.core:core-testing:2.2.0")

    // Instrumented Testing
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.44")
    kaptAndroidTest("com.google.dagger:hilt-android-compiler:2.44")

    // Debug
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
