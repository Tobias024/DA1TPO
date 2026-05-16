# Reporte QA — SubastAR (TPO DA1 1C2026)

> Análisis estático del código fuente.  
> Stack: React Native (Expo 54, TypeScript) + Spring Boot 3.3  
> Rama analizada: V2  
> Fecha: 2026-05-15

---

## PARTE 1 — REPORTE DE BUGS

### Severidad CRÍTICA

---

#### BUG-01 · Race condition en puja simultánea

**Archivo:** `backend/.../controller/PujaController.java` — líneas 50 y 123–139

La validación "el usuario ya tiene una puja en vuelo" se hace en la línea 50:

```java
long pendientes = pujaRepository.countByPostorIdAndConfirmadaFalse(postor.getId());
```

Luego la puja se guarda con `confirmada = false` (línea 129) y se confirma en una segunda operación separada (línea 138). Entre ambas operaciones, dos requests concurrentes del mismo usuario pasan el check de la línea 50, ya que ninguna aparece aún como pendiente.

**Impacto:** El mismo usuario puede publicar múltiples pujas simultáneas, saltando el límite de "una puja en vuelo".  
**Fix propuesto:** Usar un lock pesimista (`SELECT FOR UPDATE`) o un `UNIQUE INDEX` parcial en `(postor_id) WHERE confirmada = false`.

---

#### BUG-02 · Estado de sesión inconsistente tras RegisterStep2

**Archivos:**
- `mobile/.../screens/auth/RegisterStep2Screen.tsx` — línea 40
- `mobile/.../storage/SessionContext.tsx` — línea 45

`RegisterStep2Screen` llama a `refreshUser(res.user)` en lugar de `signIn(...)`. La función `refreshUser` (SessionContext línea 45) solo hace `setUser(u)` pero **nunca setea `loggedIn = true`**. El resultado: los tokens quedan guardados en AsyncStorage pero el contexto dice `loggedIn: false`.

```typescript
// SessionContext.tsx:45 — refreshUser NO actualiza loggedIn
const refreshUser = useCallback((u: SessionUser) => setUser(u), []);

// RegisterStep2Screen.tsx:40 — llama refreshUser en lugar de signIn
refreshUser(res.user);  // ← debería ser signIn(res.accessToken, res.refreshToken, res.user)
```

**Impacto:** Si el usuario navega hacia atrás o hay un re-render, la app lo trata como no autenticado pese a tener tokens válidos.  
**Fix propuesto:** Reemplazar `refreshUser(res.user)` por `signIn(res.accessToken, res.refreshToken, res.user)` en RegisterStep2Screen línea 40.

---

#### BUG-03 · Verificación de medio de pago siempre en `true`

**Archivos:**
- `backend/.../controller/MedioPagoController.java` — línea 56
- `backend/.../controller/PujaController.java` — línea 79

El campo `verificado` se setea hardcodeado a `true` en la creación de cualquier medio de pago. PujaController línea 79 valida `medioPago.isVerificado()` confiando en ese flag para autorizar una puja, pero el check es una validación vacía: siempre pasa.

```java
// MedioPagoController.java:56
.verificado(true)  // ← hardcodeado, sin validación real

// PujaController.java:79 — guard inefectivo
if (medioPago == null || !medioPago.isVerificado()) { ... }
```

**Impacto:** La guardia de "medio de pago verificado" no tiene efecto real.  
**Fix propuesto:** Si la verificación es siempre automática (fuera de scope), eliminar el check de PujaController:79 y documentar el diseño. Evita confusión en revisión de código.

---

#### BUG-04 · `/api/v1/admin/**` sin autenticación en SecurityConfig

**Archivo:** `backend/.../config/SecurityConfig.java` — línea 45

El path `/api/v1/admin/**` está en el bloque `permitAll()`. El SecurityConfig **no tiene condicional de perfil**: la regla aplica en todos los ambientes (dev y prod).

```java
.requestMatchers(
    "/api/v1/auth/**",
    "/api/v1/admin/**",   // ← sin autenticación en TODOS los perfiles
    "/h2-console/**",
    ...
).permitAll()
```

**Impacto:** En un deploy de producción, los endpoints de admin quedan accesibles sin token.  
**Fix propuesto:** Mover `/api/v1/admin/**` fuera del bloque `permitAll()` y protegerlo con rol `ADMIN`, o anotar el AdminController con `@Profile("dev")`.

---

#### BUG-05 · H2 Console accesible sin autenticación

**Archivo:** `backend/.../config/SecurityConfig.java` — línea 50

`/h2-console/**` está en `permitAll()`. Si el servidor de dev está expuesto en red local, cualquier usuario en la misma red tiene acceso total a la base de datos.

**Impacto:** Lectura y escritura sin restricción sobre toda la base de datos en desarrollo.  
**Fix propuesto:** Limitar con `@Profile("dev")` en el SecurityConfig o proteger con autenticación básica.

---

### Severidad ALTA

---

#### BUG-06 · Logout no revoca el refreshToken en el servidor

**Archivo:** `mobile/.../storage/SessionContext.tsx` — líneas 39–43

`signOut()` solo ejecuta `session.clear()` (limpia AsyncStorage) y resetea el estado local. No notifica al backend para revocar el refreshToken.

```typescript
const signOut = useCallback(async () => {
    await session.clear();   // ← solo limpia local
    setUser(null);
    setLoggedIn(false);
    // ← falta: await authApi.logout() para revocar el token en el servidor
}, []);
```

**Impacto:** Después de cerrar sesión, el refreshToken sigue siendo válido. Alguien con acceso al dispositivo puede generar nuevos accessTokens.  
**Fix propuesto:** Llamar a `POST /api/v1/auth/logout` (con el refreshToken) antes de limpiar el storage local.

---

#### BUG-07 · Refresh de token no verifica estado del usuario

**Archivo:** `backend/.../controller/AuthController.java` — líneas 149–158

El endpoint `/refresh` regenera un `accessToken` nuevo validando solo la firma del refreshToken, sin consultar si el usuario sigue activo.

**Impacto:** Un usuario suspendido puede seguir operando si hace refresh antes de que expire su token.  
**Fix propuesto:** Agregar `userRepository.findById(...).filter(User::isActivo)` antes de emitir el nuevo token, y retornar `403` si está inactivo.

---

#### BUG-08 · `precioBase` sin validación null en cálculo de límites

**Archivo:** `backend/.../model/Pieza.java` — líneas 68–79

`calcularLimiteMinimoPuja()` y `calcularLimiteMaximoPuja()` hacen `BigDecimal.multiply()` sobre `precioBase`. Si `precioBase` es `null` (la columna no tiene `@NotNull`), el método lanza `NullPointerException`.

**Impacto:** Error 500 en cualquier puja si la pieza fue creada con `precioBase = null`.  
**Fix propuesto:** Agregar `@NotNull` a `precioBase` en la entidad, o un guard `Objects.requireNonNull(precioBase, "precioBase no puede ser null")` al inicio del método.

---

### Severidad MEDIA

---

#### BUG-09 · Fotos de consignación son strings falsos (`"foto-1"`)

**Archivo:** `mobile/.../screens/ConsignmentFormScreen.tsx` — línea 27

La función `addFoto()` agrega el string literal `"foto-1"` en lugar de invocar al selector de imágenes reales.

**Impacto:** El backend recibe strings de texto en lugar de URIs o datos de imagen. Si hay validación server-side, falla silenciosamente.  
**Fix propuesto:** Integrar `expo-image-picker` para obtener URIs reales, o documentar explícitamente que es un mockup intencional para la entrega.

---

#### BUG-10 · Validación de email ausente en registro

**Archivo:** `backend/.../controller/AuthController.java` — líneas 30–35

Solo se valida que el campo email no esté vacío (`@NotBlank`). No hay validación de formato con `@Email`.

**Impacto:** Usuarios pueden registrarse con emails malformados como `"abc"` o `"test@"`.  
**Fix propuesto:** Agregar `@Email` de Jakarta Validation al DTO de registro.

---

#### BUG-11 · Categoría de usuario no se refresca desde el servidor

**Archivo:** `mobile/.../screens/ProfileScreen.tsx` — línea 42

La categoría del usuario (Oro, Plata, etc.) se lee del objeto guardado en AsyncStorage al momento del login. Si el administrador la cambia en el backend, el cliente sigue mostrando la categoría vieja.

**Impacto:** UX confusa. El usuario puede operar creyendo tener una categoría que ya no posee.  
**Fix propuesto:** Agregar un `useEffect` que haga `GET /api/v1/usuarios/me` al montar ProfileScreen y actualice el contexto con el valor actualizado.

---

#### BUG-12 · Monto negativo o cero en cheque certificado no se valida

**Archivo:** `mobile/.../screens/AddPaymentMethodScreen.tsx` — línea 32

La expresión `Number(garantia) || undefined` convierte el string `"0"` en `undefined` (porque `0` es falsy) y no rechaza valores negativos.

**Impacto:** Si el usuario ingresa `0` o un número negativo, el valor enviado al backend es `undefined` o negativo.  
**Fix propuesto:** Validar explícitamente `Number(garantia) > 0` antes de habilitar el envío del formulario.

---

### Severidad BAJA

---

#### BUG-13 · JWT secret hardcodeado en `application.properties`

**Archivo:** `backend/src/main/resources/application.properties` — línea 22

```properties
jwt.secret=SubastAppSecretKeyForJWTSigningMustBe256BitsLongOrMore
```

Clave predecible en texto plano comiteada al repositorio.  
**Fix propuesto:** Usar variable de entorno `${JWT_SECRET}` sin valor por defecto.

---

#### BUG-14 · Credenciales de base de datos en texto plano

**Archivo:** `backend/src/main/resources/application.properties` — líneas 11–12

```properties
spring.datasource.username=postgres
spring.datasource.password=postgres
```

**Fix propuesto:** Variables de entorno `${DB_USER}` y `${DB_PASSWORD}`.

---

#### BUG-15 · Sin índice en query crítica de pujas pendientes

**Archivo:** `backend/.../repository/PujaRepository.java`

`countByPostorIdAndConfirmadaFalse(postor.getId())` hace table scan completo en cada puja.

**Fix propuesto:** Agregar `@Index(columnList = "postor_id, confirmada")` en la entidad `Puja`.

---

## PARTE 2 — PROPUESTAS DE MEJORA

---

### MEJORA-01 · Loading states en pantallas de acción

**Contexto:** Varias pantallas (puja, login, registro) no muestran feedback visual mientras esperan respuesta del backend.  
**Propuesta:** Agregar `isLoading` state en cada acción asíncrona y deshabilitar el botón con un `ActivityIndicator` mientras se procesa. Evita doble-tap accidental, especialmente crítico en el flujo de pujas.

---

### MEJORA-02 · Manejo global de errores de red

**Contexto:** Los bloques `catch` de Axios en las pantallas hacen `console.error` o no muestran nada al usuario.  
**Propuesta:** Crear un interceptor Axios centralizado que convierta errores de red en mensajes de `Alert` o toast. Un solo punto de mantenimiento para todos los mensajes de error.

---

### MEJORA-03 · Countdown en tiempo real en pantalla de subasta

**Contexto:** AuctionDetailScreen muestra el tiempo restante pero no actualiza el contador dinámicamente.  
**Propuesta:** Usar `setInterval` con cleanup en `useEffect` para actualizar el countdown cada segundo. Mejora notablemente la percepción de dinamismo.

---

### MEJORA-04 · Separar correctamente los perfiles de Spring Boot

**Contexto:** Configuración de H2, admin endpoints y credenciales de dev están en `application.properties` base.  
**Propuesta:** Mover toda configuración sensible de desarrollo a `application-dev.properties` y de producción a `application-prod.properties`. El archivo base solo debe contener valores seguros por defecto.

---

### MEJORA-05 · Bean Validation completo en todos los DTOs

**Contexto:** Campos críticos como `precioBase`, `tipoBien`, `descripcion` no tienen anotaciones de validación.  
**Propuesta:** Agregar `@Valid` en los controllers y anotar cada DTO con Jakarta Validation (`@NotNull`, `@Min`, `@Size`, `@Email`). Spring rechaza automáticamente requests inválidos con mensajes de error descriptivos.

---

### MEJORA-06 · Badge de estado en lista de consignaciones

**Contexto:** El usuario envía una consignación pero no tiene visibilidad del estado (pendiente, aprobada, rechazada).  
**Propuesta:** Mostrar un badge de color en la lista: gris = pendiente, verde = aprobada, rojo = rechazada. El campo `estado` ya existe en el backend.

---

### MEJORA-07 · Confirmación antes de publicar una puja

**Contexto:** El botón de puja ejecuta la acción inmediatamente sin confirmación.  
**Propuesta:** Mostrar un `Alert.alert("¿Confirmar puja?", "Vas a pujar $X.XXX")` antes de hacer el request. Evita pujas accidentales en montos altos.

---

## Resumen ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| Crítica | 5 |
| Alta | 3 |
| Media | 4 |
| Baja | 3 |
| **Total bugs** | **15** |
| Mejoras propuestas | 7 |

**Bugs que afectan directamente el flujo principal del TP:**

| Bug | Impacto |
|-----|---------|
| BUG-01 | Race condition permite múltiples pujas simultáneas del mismo usuario |
| BUG-02 | Sesión inconsistente tras el registro (Step 2 → Step 3) |
| BUG-03 | La validación de medio de pago verificado no tiene efecto real |
| BUG-08 | NPE en cálculo de límite de puja si `precioBase` es null |
