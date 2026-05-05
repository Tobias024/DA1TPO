# Mapeo entre el schema legacy y el modelo de la app

El TPO indica que la app móvil **se integra con un sistema local existente** de la
empresa de subastas:

> *"La empresa posee actualmente un sistema local que contiene toda la información
> de las subastas… Nuestra app deberá consumir y actualizar esa información."*
> — `TPO_DAI_1C2026.pdf`

El esquema relacional de ese sistema legacy está en
[`EstructuraActual.sql`](EstructuraActual.sql) (DDL provisto por la cátedra,
SQL Server / T-SQL). [`EstructuraActual_h2.sql`](EstructuraActual_h2.sql) es la
versión limpia y ejecutable del mismo.

El backend Spring Boot **toma como fuente de verdad este schema legacy**
para las tablas centrales del dominio, agregando un puñado de tablas extras
para los conceptos del PDF que el legacy no modela (notificaciones, multas,
consignaciones — ver al pie).

## Mapeo de tablas legacy → backend

| Tabla legacy | Entidad backend | `@Table(name=…)` | Notas |
|---|---|---|---|
| `paises` | `Pais` | `paises` | ✅ Implementado. Endpoint público `GET /api/v1/paises/todos`. |
| `personas` | parte de `Usuario` | `usuarios` | El backend fusiona `personas` + `clientes` en una única `Usuario`. Los datos (`documento`, `nombre`, `direccion`, `foto`) están todos en `Usuario`. |
| `empleados` | — | — | No expuesto. Internos de la empresa, no relevantes para la app móvil. |
| `sectores` | — | — | Idem empleados. |
| `clientes` | parte de `Usuario` | `usuarios` | Aporta `categoria`, `paisOrigen`. El campo `verificador` (FK a empleado) no se modela — la verificación es del lado de la empresa subastadora (sistema externo, fuera de scope de esta entrega). |
| `duenios` | parte de `Usuario` | `usuarios` | Mismo `Usuario` actúa como dueño cuando consigna. Los flags `verificacionFinanciera`/`verificacionJudicial`/`calificacionRiesgo` son KYC interno y no se exponen. |
| `subastadores` | `Rematador` | `subastadores` ✓ | ✅ Renombrado al nombre legacy. |
| `subastas` | `Subasta` | `subastas` | El backend agrega un enum `EstadoSubasta` con más valores (PROXIMA, EN_CURSO, CANCELADA) que el legacy (`abierta`/`cerrada`). Atributos del recinto (`tieneDeposito`, `seguridadPropia`, `capacidadAsistentes`) no se exponen. |
| `productos` | `Pieza` | `productos` ✓ | ✅ Renombrado al nombre legacy. La `Pieza` del backend fusiona `productos` + `itemsCatalogo` (ver siguiente fila). |
| `fotos` | `Pieza.imagenes` | (`@ElementCollection`) | URLs de fotos como colección en el producto. |
| `seguros` | `PolizaSeguro` | `seguros` ✓ | ✅ Renombrado al nombre legacy. |
| `catalogos` | `Catalogo` | `catalogos` | ✅ Implementado para preservar la estructura legacy. La API móvil sigue exponiendo el catálogo embebido en `Subasta.catalogo` por simplicidad, pero la entidad `Catalogo` existe. |
| `itemsCatalogo` | `ItemCatalogo` (+ embebido en `Pieza`) | `items_catalogo` | ✅ Implementado. Los datos económicos (`precioBase`, `comision`, `subastado`) viven embebidos en `Pieza` por conveniencia de la API móvil; la entidad `ItemCatalogo` existe para casos donde se necesite la estructura legacy 1:1. |
| `asistentes` | `Asistente` | `asistentes` | ✅ Implementado. Se usa cuando un postor entra a una subasta vía `POST /auctions/{id}/join` — se crea (o reusa) un Asistente con `numeroPostor` único en esa subasta. |
| `pujos` | `Puja` | `pujos` ✓ | ✅ Renombrado al nombre legacy. |
| `registroDeSubasta` | `Venta` | `registroDeSubasta` ✓ | ✅ Renombrado al nombre legacy. |

## Tablas extras de la app móvil

Estas tablas no están en el SQL del legacy pero el PDF las requiere
explícitamente. Se mantienen como **extensiones de la app móvil**, no son
del sistema interno de la empresa.

| Tabla | Por qué se necesita |
|---|---|
| `medios_pago` | El PDF exige adjuntar tarjetas/cuentas/cheques certificados. La verificación efectiva la hace la empresa subastadora (externa); la app sólo registra la información — por eso `verificado` arranca en `true` por default. |
| `notificaciones` | Centro de alertas (`solicitud aceptada`, `nueva subasta`, `subasta adquirida`). El legacy no lo modela. |
| `consignaciones` | Flujo "subastar algo propio" (PDF: solicitud → inspección → aceptada/rechazada). El legacy modela el resultado (`productos` + `seguros`) pero no el flujo de intake. |
| `Usuario.tieneMulta` / `montoPendienteMulta` | Multa del 10% por incumplimiento de pago (PDF). |

## Conceptos del PDF que no requieren tabla

- Reglas de puja `mín = mejor + 1% base`, `máx = mejor + 20% base`, sin tope para ORO/PLATINO → lógica en `PujaController`.
- Una subasta activa por usuario → campo `Usuario.subastaActivaId`.
- Streaming → URL externa en `Subasta.streamingUrl`.

## Estrategia adoptada

**Schema replicado, nombres legacy**: el backend Spring Boot tiene su propio
schema H2/Postgres con las tablas core del legacy (mismos nombres,
`subastas`/`pujos`/`productos`/`subastadores`/etc.) más las extras del PDF.
Para producción, los repos JPA podrían apuntarse al sistema legacy de la
empresa cambiando solo `application.properties` — la mayoría de los nombres
ya coinciden 1:1.

## Archivos relevantes

- [`EstructuraActual.sql`](EstructuraActual.sql) — original de la cátedra (T-SQL).
- [`EstructuraActual_h2.sql`](EstructuraActual_h2.sql) — versión limpia para H2.
- [`swagger_subastar.yaml`](swagger_subastar.yaml) — contrato OpenAPI de la API móvil.
- `backend/src/main/java/com/subastapp/model/` — entidades JPA del backend.
