# SubastAR — TPO DA1 (1C 2026)

App móvil de subastas dinámicas ascendentes. Backend en Spring Boot + frontend en React Native (Expo).

## Estructura

```
DA1TPO/
├── backend/          Spring Boot 3.3 + JPA + JWT + WebSocket STOMP (Java 17)
├── mobile/           React Native + Expo SDK 54 + TypeScript
├── Bruno/            Colección Bruno con todos los endpoints + flujos demo
├── Doc/              Consigna PDF, Explicación de Pantallas, swagger, paleta CSS, schema legacy
└── apis.yaml         Copia del swagger (OpenAPI 3.0)
```

## Requisitos

- **Java 17+** y **Maven** para el backend
- **Node 20+** para el frontend
- **Android Studio + emulador** o un **celular Android con Expo Go** (SDK 54)
- **adb** (para correr por cable): `sudo apt install adb`

---

## 1. Levantar el backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Esperá ver en consola:

```
Started SubastAppApplication in X.X seconds
Seed dev: usuario de prueba creado.   (primera vez)
o
Seed dev: usuario de prueba ya existe, salteando.   (siguientes)
```

El backend escucha en `http://localhost:8080`. La consola de la base H2 está en `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:file:./data/subastar`, user `sa`, pass vacío).

### Cuenta de prueba

```
Documento: 11111111
Password : test1234
Categoría: ORO  (sin tope de puja, ve casi todas las subastas)
```

Incluye además una tarjeta verificada y una subasta abierta de muestra.

> H2 persiste en `backend/data/subastar.mv.db`. Para empezar de cero:
> `rm -rf backend/data/`

### Verificación

```bash
curl -i http://localhost:8080/api/v1/auctions
# Tiene que devolver 403 (no autenticado, pero el backend responde)
```

---

## 2. Levantar la app — opción A: Wi-Fi normal (mismo router)

Apto si la PC y el celular están en la **misma red doméstica**, sin restricciones.

```bash
cd mobile
npm install                # solo la primera vez
npm start
```

1. Abrí **Expo Go** en el celular.
2. Escaneá el QR que aparece en la terminal.
3. La app levanta y se conecta directo al backend en la IP local de la PC.

Si la app no se conecta al backend, editá `mobile/app.json` y poné la IP de tu PC:

```json
"extra": {
  "apiBaseUrl": "http://192.168.X.X:8080/api/v1"
}
```

Usá `ip a` en Linux o `ipconfig` en Windows para averiguar tu IP. Reiniciá Metro con `npm start -- --clear` después del cambio.

---

## 3. Levantar la app — opción B: USB + `adb reverse` (red de facu / Wi-Fi restringida)

Cuando la red local no deja que el celular hable con la PC (campus universitario, red corporativa, hotel, etc.), conectá por cable USB y forzá los puertos vía adb. **No requiere internet ni Wi-Fi.**

### Setup en el celular (una sola vez)

1. Ajustes → *Acerca del teléfono* → tap 7 veces a *Número de compilación* (activa Opciones de Desarrollador).
2. Ajustes → *Sistema* → *Opciones de desarrollador* → activá **Depuración USB**.
3. Conectá el cable. Cuando aparezca el popup *¿Permitir depuración USB desde esta computadora?* marcá *Permitir siempre* y aceptá.
4. En la barra de notificaciones del celular, cambiá el modo USB de *Solo carga* a *Transferencia de archivos*.

### Cada vez que levantás la app

```bash
# Verificá que adb ve el celular
adb devices
# Tiene que aparecer una línea con tu device_id + "device"

# Mapeá los dos puertos al celular
adb reverse tcp:8081 tcp:8081      # Metro (Expo)
adb reverse tcp:8080 tcp:8080      # Backend Spring Boot

# Asegurate que apiBaseUrl apunta a localhost en mobile/app.json:
#   "apiBaseUrl": "http://localhost:8080/api/v1"

# Levantá Metro
cd mobile
npm start
```

En **Expo Go**:

1. Pantalla principal → tap *Enter URL manually*.
2. Pegá: `exp://localhost:8081`
3. Tap *Connect*.

> ⚠️ **No escanees el QR** en este modo: el QR contiene la IP LAN, que en la red restringida no es alcanzable. La URL `exp://localhost:8081` solo funciona porque `adb reverse` redirige el `localhost` del celular hacia tu PC.

### Diagnóstico rápido (modo cable)

```bash
adb devices                # ¿Aparece el celu?
adb reverse --list         # ¿Están los dos mappings?
```

Desde el browser del celular:

- `http://localhost:8080/api/v1/auctions` → debe devolver "Forbidden" (403). Si timeoutea, repetir `adb reverse tcp:8080 tcp:8080`.

Si reconectás el cable o reiniciás el celular, los `adb reverse` se borran — hay que repetirlos.

### Tip: script todo-en-uno

```bash
# Desde la raíz del proyecto, en una terminal:
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# En otra terminal:
adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8080 tcp:8080
cd mobile && npm start
```

---

## 4. Build de Android (entrega 3)

```bash
cd mobile
npx expo prebuild           # genera carpetas android/ ios/
npx expo run:android        # build + install en emulador o device USB
```

Para un APK distribuible:

```bash
eas build -p android --profile preview
```

Requiere cuenta de Expo y `eas-cli`.

---

## Documentación

- [Doc/TPO_DAI_1C2026.pdf](Doc/TPO_DAI_1C2026.pdf) — consigna oficial.
- [Doc/Explicacion de Pantallas.md](Doc/Explicacion%20de%20Pantallas.md) — descripción de las 22 pantallas.
- [Doc/CSS.md](Doc/CSS.md) — paleta y tipografías.
- [Doc/swagger_subastar.yaml](Doc/swagger_subastar.yaml) — contrato OpenAPI 3.0 de la API.

### Probar la API con Bruno

La carpeta [`Bruno/`](Bruno/) tiene una colección completa con todos los endpoints, agrupados por flujo. Incluye:

- Auto-guardado de tokens y IDs entre requests.
- Endpoints **admin solo de dev** (`/api/v1/admin/*`) que simulan el lado "empresa subastadora" para hacer demos del ciclo completo de una consignación (PENDIENTE → EN_INSPECCION → ACEPTADO/RECHAZADO → EN_SUBASTA → VENDIDO).
- Documentación de los flujos en [Bruno/README.md](Bruno/README.md).

Ver instrucciones en [Bruno/README.md](Bruno/README.md).

### Sistema legacy de la empresa

La consigna indica que la app se integra con un sistema local pre-existente de la empresa. El esquema relacional lo provee la cátedra:

- [Doc/EstructuraActual.sql](Doc/EstructuraActual.sql) — DDL original (SQL Server / T-SQL).
- [Doc/EstructuraActual_h2.sql](Doc/EstructuraActual_h2.sql) — versión limpia y ejecutable en H2 (typos corregidos).
- [Doc/Mapeo_Schema_Legacy.md](Doc/Mapeo_Schema_Legacy.md) — correspondencia entre cada tabla del legacy y la entidad / endpoint del backend.
