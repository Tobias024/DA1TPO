# Colección Bruno — SubastAR API

Colección [Bruno](https://www.usebruno.com/) con todos los endpoints del
backend, organizada para hacer **demos en vivo** de los flujos del PDF.

## Setup (una sola vez)

1. Instalar Bruno: <https://www.usebruno.com/downloads>.
2. Bruno → *Open Collection* → seleccionar la carpeta `Bruno/`.
3. Arriba a la derecha, seleccionar el environment **`Local`**.
4. Levantar el backend en perfil `dev`:
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```
5. Ejecutar **`01 - Auth/01 Login.bru`** primero.
   Auto-guarda `accessToken`, `refreshToken` y `userId` en el environment.

A partir de ahí cualquier request con `auth: bearer` ya tiene el token.

## Estructura

```
01 - Auth                  Login, Register Step1/2, Refresh
02 - Catálogos             Países (sin auth)
03 - Subastas              Listar, Detalle, Catálogo, Join, Leave
04 - Pujas                 Historial, Pujar
05 - Consignaciones        Listar, Detalle, Crear, Aceptar/Rechazar oferta
06 - Admin (simula empresa) ← Solo perfil dev. Flipea estados de consignaciones
07 - Perfil                Mi perfil, Métricas, Editar
08 - Medios de Pago        Listar, Agregar Tarjeta, Agregar Cheque
09 - Notificaciones        Listar
10 - Sales                 Mis compras
```

## Flujos de demo

### Flujo 1 — Postor: registro y primera puja

1. `01 - Auth / 02 Register Step1` → crea cuenta nueva.
2. (Mirar logs del backend o `select * from usuarios` en H2 console para sacar el `registrationToken`.)
3. `01 - Auth / 03 Register Step2` → completa registro con el token.
4. `08 - Medios de Pago / 02 Agregar Tarjeta`.
5. `03 - Subastas / 01 Listar Activas`.
6. `03 - Subastas / 04 Join` → entra a la subasta.
7. `04 - Pujas / 02 Pujar` → realiza una oferta.

### Flujo 2 — Dueño: ciclo completo de consignación (lo que el usuario pidió)

Empresa (Bruno) y usuario (Bruno o app) se turnan:

| # | Quién | Request | Estado resultante |
|---|---|---|---|
| 1 | Usuario | `05 - Consignaciones / 03 Crear` | `PENDIENTE` |
| 2 | Empresa | `06 - Admin / 01 Iniciar Inspección` | `EN_INSPECCION` |
| 3 | Empresa | `06 - Admin / 02 Proponer (precio + comisión)` | `PENDIENTE_CONFIRMACION_USUARIO` |
| 4 | Usuario | `05 - Consignaciones / 04 Aceptar Oferta` | `EN_SUBASTA` |
| 5 | Empresa | `06 - Admin / 04 Marcar Vendido` | `VENDIDO` |

Variante de **rechazo** desde la empresa (entre paso 2 y 3):
- `06 - Admin / 03 Rechazar` → `RECHAZADO` con causa + gastos de devolución.

Variante de **rechazo** desde el usuario (en paso 4):
- `05 - Consignaciones / 05 Rechazar Oferta` → `DEVUELTO`.

### Flujo 3 — Estado inicial del seed dev

El usuario `11111111` arranca con **5 consignaciones**, una en cada estado:

| Estado | Bien |
|---|---|
| `PENDIENTE` | Reloj de bolsillo |
| `EN_INSPECCION` | Pintura al óleo |
| `PENDIENTE_CONFIRMACION_USUARIO` | Vajilla porcelana (oferta: $80.000, comisión 15%) |
| `RECHAZADO` | Cuadro decorativo (causa + gastos $3.500) |
| `EN_SUBASTA` | Anillo de oro (oferta: $520.000, comisión 12%) |

Eso es para que la pantalla "Mis Subastas" en la app móvil ya tenga
algo que mostrar sin pegarle nada al admin.

## Variables del environment

| Variable | Cómo se llena | Para qué |
|---|---|---|
| `baseUrl` | hardcoded `http://localhost:8080/api/v1` | base de todos los requests |
| `documento` / `password` | hardcoded `11111111` / `test1234` | usuario seed |
| `accessToken` | auto en `01 Login` | header Bearer |
| `refreshToken` | auto en `01 Login` | refresh |
| `userId` | auto en `01 Login` | tu ID |
| `auctionId` | auto en `03 - Subastas / 01 Listar Activas` | encadenar joins/pujas |
| `consignmentId` | auto en `05 - Consignaciones / 01 Listar` (toma la PENDIENTE primero) o en `03 Crear` | flujo admin de transiciones |

Si querés operar contra otra consignación, editá `consignmentId` a mano
en *Environment* → *Local*.

## Notas

- Endpoints de **`06 - Admin`** **solo funcionan con el backend en perfil `dev`** (`-Dspring-boot.run.profiles=dev`). En producción no se montan.
- El refresh-token automático no está implementado en el cliente — si te da 401 en medio de la demo, vuelve a correr `01 Login`.
- Si cambiás algo en el backend que afecte el schema, borrá `backend/data/` antes de reiniciar para aplicar los cambios.
