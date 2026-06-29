package com.subastapp.controller;

import com.subastapp.config.DevDataSeeder;
import com.subastapp.model.Consignacion;
import com.subastapp.model.MedioPago;
import com.subastapp.model.Notificacion;
import com.subastapp.model.Pieza;
import com.subastapp.model.PolizaSeguro;
import com.subastapp.model.Subasta;
import com.subastapp.model.Usuario;
import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoConsignacion;
import com.subastapp.model.enums.EstadoPieza;
import com.subastapp.model.enums.EstadoUsuario;
import com.subastapp.model.enums.TipoNotificacion;
import com.subastapp.repository.ConsignacionRepository;
import com.subastapp.repository.MedioPagoRepository;
import com.subastapp.repository.NotificacionRepository;
import com.subastapp.repository.PiezaRepository;
import com.subastapp.repository.SubastaRepository;
import com.subastapp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Endpoints administrativos para simular el lado "empresa subastadora".
 *
 * Solo activo con perfil `dev`. Permiten que la EMPRESA sea un actor real
 * (no una simulación automática): aprobar/rechazar usuarios asignando categoría,
 * verificar/rechazar medios de pago, y asignar bienes aceptados a una subasta.
 * Se disparan desde Swagger/Bruno.
 *
 * NO requieren JWT — están abiertos en SecurityConfig bajo `/api/v1/admin/**`.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Profile("dev")
public class AdminController {

    private final ConsignacionRepository consignaciones;
    private final SubastaRepository subastas;
    private final UsuarioRepository usuarios;
    private final MedioPagoRepository mediosPago;
    private final NotificacionRepository notificaciones;
    private final PiezaRepository piezas;
    private final DevDataSeeder devDataSeeder;

    // =================================================================
    // Demo
    // =================================================================

    /**
     * Resetea la demo: borra subastas/pujas/ventas/notificaciones y las regenera con
     * ventanas de puja frescas (relativas a ahora).
     */
    @PostMapping("/reset-demo")
    public ResponseEntity<?> resetDemo() {
        devDataSeeder.resetDemo();
        return ResponseEntity.ok(Map.of(
                "message", "Subastas de demo regeneradas con ventanas frescas. Recargá la app."
        ));
    }

    // =================================================================
    // Usuarios — aprobación / rechazo (empresa)
    // =================================================================

    /** Lista usuarios por estado (default: los pendientes de verificación). */
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@RequestParam(defaultValue = "PENDIENTE_VERIFICACION") String estado) {
        EstadoUsuario e;
        try {
            e = EstadoUsuario.valueOf(estado);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado inválido"));
        }
        List<Map<String, Object>> out = usuarios.findByEstado(e).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("nombre", u.getNombre());
            m.put("apellido", u.getApellido());
            m.put("email", u.getEmail());
            m.put("documento", u.getDocumento());
            m.put("estado", u.getEstado().name());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    /**
     * Empresa: aprueba la solicitud de registro y le asigna categoría.
     * PENDIENTE_VERIFICACION → PENDIENTE_COMPLETAR_REGISTRO (emite el token del paso 2).
     *
     * Body: { "categoria": "ORO" }  (default COMUN)
     */
    @PatchMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable String id,
                                         @RequestBody(required = false) Map<String, Object> body) {
        Usuario u = usuarios.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        if (u.getEstado() != EstadoUsuario.PENDIENTE_VERIFICACION) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El usuario no está pendiente de verificación"));
        }
        CategoriaUsuario categoria = CategoriaUsuario.COMUN;
        if (body != null && body.get("categoria") != null) {
            try {
                categoria = CategoriaUsuario.valueOf(body.get("categoria").toString());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Categoría inválida"));
            }
        }
        u.setCategoria(categoria);
        u.setRegistrationToken(UUID.randomUUID().toString());
        u.setRegistrationTokenExpiry(LocalDateTime.now().plusHours(24));
        u.setEstado(EstadoUsuario.PENDIENTE_COMPLETAR_REGISTRO);
        usuarios.save(u);

        crearNotif(u, TipoNotificacion.CUENTA_APROBADA, "Cuenta aprobada",
                "Tu cuenta fue verificada y aprobada con categoría " + categoria
                        + ". Completá tu registro definiendo una contraseña.", null);

        return ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "estado", u.getEstado().name(),
                "categoria", categoria.name(),
                "registrationToken", u.getRegistrationToken()
        ));
    }

    /**
     * Empresa: rechaza la solicitud de registro.
     * PENDIENTE_VERIFICACION → RECHAZADO
     *
     * Body: { "motivoRechazo": "..." }
     */
    @PatchMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable String id,
                                        @RequestBody(required = false) Map<String, String> body) {
        Usuario u = usuarios.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        if (u.getEstado() != EstadoUsuario.PENDIENTE_VERIFICACION) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El usuario no está pendiente de verificación"));
        }
        String motivo = body != null && body.get("motivoRechazo") != null
                ? body.get("motivoRechazo")
                : "La empresa no pudo validar tu identidad.";
        u.setMotivoRechazo(motivo);
        u.setEstado(EstadoUsuario.RECHAZADO);
        usuarios.save(u);

        crearNotif(u, TipoNotificacion.CUENTA_RECHAZADA, "Cuenta rechazada", motivo, null);

        return ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "estado", u.getEstado().name(),
                "motivoRechazo", motivo
        ));
    }

    // =================================================================
    // Medios de pago — verificación (empresa)
    // =================================================================

    /** Lista medios de pago pendientes de verificación. */
    @GetMapping("/payment-methods")
    public ResponseEntity<?> listPendingPayments() {
        List<Map<String, Object>> out = mediosPago.findByVerificadoFalse().stream().map(mp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", mp.getId());
            m.put("tipo", mp.getTipo() != null ? mp.getTipo().name() : null);
            m.put("verificado", mp.isVerificado());
            m.put("usuarioId", mp.getUsuario() != null ? mp.getUsuario().getId() : null);
            m.put("usuarioDocumento", mp.getUsuario() != null ? mp.getUsuario().getDocumento() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    /** Empresa: verifica un medio de pago → habilita al usuario a pujar. Idempotente. */
    @PatchMapping("/payment-methods/{id}/verify")
    public ResponseEntity<?> verifyPayment(@PathVariable String id) {
        MedioPago mp = mediosPago.findById(id).orElse(null);
        if (mp == null) return ResponseEntity.notFound().build();
        mp.setVerificado(true);
        mediosPago.save(mp);
        crearNotif(mp.getUsuario(), TipoNotificacion.MEDIO_PAGO_VERIFICADO, "Medio de pago verificado",
                "Tu medio de pago fue verificado por la empresa. Ya podés pujar.", mp.getId());
        return ResponseEntity.ok(Map.of("id", mp.getId(), "verificado", true));
    }

    /** Empresa: rechaza un medio de pago (queda sin verificar). Body: { "motivo": "..." } */
    @PatchMapping("/payment-methods/{id}/reject")
    public ResponseEntity<?> rejectPayment(@PathVariable String id,
                                           @RequestBody(required = false) Map<String, String> body) {
        MedioPago mp = mediosPago.findById(id).orElse(null);
        if (mp == null) return ResponseEntity.notFound().build();
        mp.setVerificado(false);
        mediosPago.save(mp);
        String motivo = body != null && body.get("motivo") != null
                ? body.get("motivo")
                : "El medio de pago no pudo ser verificado.";
        crearNotif(mp.getUsuario(), TipoNotificacion.MEDIO_PAGO_RECHAZADO, "Medio de pago rechazado",
                motivo, mp.getId());
        return ResponseEntity.ok(Map.of("id", mp.getId(), "verificado", false));
    }

    // =================================================================
    // Consignaciones (empresa)
    // =================================================================

    /**
     * Empresa: empieza la inspección física de la consignación.
     * PENDIENTE → EN_INSPECCION
     */
    @PatchMapping("/consignments/{id}/start-inspection")
    public ResponseEntity<?> startInspection(@PathVariable String id) {
        return consignaciones.findById(id).map(c -> {
            c.setEstado(EstadoConsignacion.EN_INSPECCION);
            consignaciones.save(c);
            crearNotif(c.getUsuario(), TipoNotificacion.CONSIGNACION_EN_INSPECCION, "Producto recibido",
                    "Recibimos tu bien y está en inspección. Te avisaremos el resultado.", c.getId());
            return ResponseEntity.ok(Map.of(
                    "id", c.getId(),
                    "estado", c.getEstado().name(),
                    "message", "Consignación pasó a inspección."
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Empresa: aceptó el bien tras inspección y propone valor base + comisión.
     * (La subasta NO se elige acá — eso es un paso explícito posterior: /assign.)
     * EN_INSPECCION → PENDIENTE_CONFIRMACION_USUARIO
     *
     * Body: { "precioBaseOfrecido": 250000, "comision": 0.15 }
     */
    @PatchMapping("/consignments/{id}/propose")
    public ResponseEntity<?> propose(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return consignaciones.findById(id).map(c -> {
            if (c.getEstado() != EstadoConsignacion.EN_INSPECCION) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "La consignación no está en inspección"));
            }
            BigDecimal precio = body.get("precioBaseOfrecido") != null
                    ? new BigDecimal(body.get("precioBaseOfrecido").toString()) : null;
            BigDecimal comision = body.get("comision") != null
                    ? new BigDecimal(body.get("comision").toString()) : null;

            if (precio == null || comision == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "precioBaseOfrecido y comision son requeridos"
                ));
            }

            c.setPrecioBaseOfrecido(precio);
            c.setComision(comision);
            c.setEstado(EstadoConsignacion.PENDIENTE_CONFIRMACION_USUARIO);
            consignaciones.save(c);

            crearNotif(c.getUsuario(), TipoNotificacion.CONSIGNACION_ACEPTADA, "Artículo aceptado",
                    "Aceptamos tu bien tras la inspección. Revisá la propuesta de precio base y comisión.",
                    c.getId());

            return ResponseEntity.ok(Map.of(
                    "id", c.getId(),
                    "estado", c.getEstado().name(),
                    "precioBaseOfrecido", c.getPrecioBaseOfrecido(),
                    "comision", c.getComision(),
                    "message", "Propuesta enviada. Esperando confirmación del usuario."
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Empresa: rechazó el bien tras inspección.
     * EN_INSPECCION → RECHAZADO
     *
     * Body: { "causaRechazo": "...", "gastosDevolucion": 5000 }
     */
    @PatchMapping("/consignments/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return consignaciones.findById(id).map(c -> {
            c.setCausaRechazo((String) body.getOrDefault("causaRechazo",
                    "El bien no cumple los criterios de la subasta."));
            BigDecimal gastos = body.get("gastosDevolucion") != null
                    ? new BigDecimal(body.get("gastosDevolucion").toString())
                    : new BigDecimal("0");
            c.setGastosDevolucion(gastos);
            c.setEstado(EstadoConsignacion.RECHAZADO);
            consignaciones.save(c);

            LocalDateTime llegada = LocalDateTime.now().plusDays(7);
            crearNotif(c.getUsuario(), TipoNotificacion.CONSIGNACION_RECHAZADA, "Artículo rechazado",
                    "Tu bien fue rechazado. Motivo: " + c.getCausaRechazo()
                            + ". Gastos de devolución: $" + c.getGastosDevolucion().toPlainString()
                            + ". Llegada estimada: " + llegada.toLocalDate() + ".", c.getId());

            return ResponseEntity.ok(Map.of(
                    "id", c.getId(),
                    "estado", c.getEstado().name(),
                    "causaRechazo", c.getCausaRechazo(),
                    "gastosDevolucion", c.getGastosDevolucion()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Empresa: asigna un bien ya ACEPTADO por el usuario a una subasta/catálogo concreto.
     * Este es el momento EXPLÍCITO en que la empresa decide en qué subasta entra el bien:
     * crea la Pieza (con depósito + póliza de seguro), la agrega al catálogo de la subasta,
     * y notifica al vendedor. ACEPTADO → EN_SUBASTA.
     *
     * Body: {
     *   "subastaId": "..." (req),
     *   "numeroItem": 7 (opcional),
     *   "deposito": { "nombre": "...", "direccion": "...", "sector": "..." } (opcional),
     *   "poliza": { "numeroPoliza": "...", "compania": "...", "contactoCompania": "...",
     *               "montoAsegurado": 250000 } (opcional)
     * }
     */
    @PatchMapping("/consignments/{id}/assign")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> assign(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Consignacion c = consignaciones.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();
        if (c.getEstado() != EstadoConsignacion.ACEPTADO) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "La consignación debe estar ACEPTADA por el usuario para asignarla a una subasta"));
        }
        if (c.getPrecioBaseOfrecido() == null) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("error", "Falta el precio base ofrecido para crear la pieza"));
        }
        if (c.getPieza() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "La consignación ya fue asignada a una subasta"));
        }
        String subastaId = (String) body.get("subastaId");
        if (subastaId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "subastaId es requerido"));
        }
        Subasta s = subastas.findById(subastaId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Subasta no encontrada"));
        }

        LocalDateTime now = LocalDateTime.now();

        int numeroItem = body.get("numeroItem") != null
                ? Integer.parseInt(body.get("numeroItem").toString())
                : s.getCatalogo().stream().map(Pieza::getNumeroItem).filter(Objects::nonNull)
                    .max(Integer::compareTo).orElse(0) + 1;

        Map<String, Object> dep = (Map<String, Object>) body.get("deposito");
        String depNombre = dep != null && dep.get("nombre") != null ? dep.get("nombre").toString() : "Depósito Central";
        String depDir = dep != null && dep.get("direccion") != null ? dep.get("direccion").toString() : "Av. de los Constituyentes 1234";
        String depSector = dep != null && dep.get("sector") != null ? dep.get("sector").toString() : "C-" + numeroItem;

        Pieza p = Pieza.builder()
                .numeroItem(numeroItem)
                .descripcion(c.getDescripcion())
                .precioBase(c.getPrecioBaseOfrecido())
                .estado(EstadoPieza.EN_DEPOSITO)
                .imagenes(new ArrayList<>(c.getFotos())) // copia: no compartir la @ElementCollection
                .dueno(c.getUsuario())
                .depositoNombre(depNombre)
                .depositoDireccion(depDir)
                .depositoSector(depSector)
                .subasta(s)
                .build();

        Map<String, Object> pol = (Map<String, Object>) body.get("poliza");
        BigDecimal montoAsegurado = pol != null && pol.get("montoAsegurado") != null
                ? new BigDecimal(pol.get("montoAsegurado").toString())
                : c.getPrecioBaseOfrecido();
        PolizaSeguro poliza = PolizaSeguro.builder()
                .numeroPoliza(pol != null && pol.get("numeroPoliza") != null ? pol.get("numeroPoliza").toString()
                        : "POL-" + now.getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .compania(pol != null && pol.get("compania") != null ? pol.get("compania").toString() : "La Aseguradora S.A.")
                .contactoCompania(pol != null && pol.get("contactoCompania") != null ? pol.get("contactoCompania").toString()
                        : "siniestros@laaseguradora.com")
                .montoAsegurado(montoAsegurado)
                .moneda(s.getMoneda())
                .vigenciaDesde(now)
                .vigenciaHasta(now.plusYears(1))
                .beneficiario(c.getUsuario())
                .pieza(p)
                .build();
        p.setPolizaSeguro(poliza);

        // Adjuntar al catálogo (espejo de DevDataSeeder.attach) y persistir (cascada la póliza).
        s.getCatalogo().add(p);
        piezas.save(p);

        c.setPieza(p);
        c.setSubastaAsignada(s);
        c.setFechaSubastaAsignada(now);
        c.setEstado(EstadoConsignacion.EN_SUBASTA);
        consignaciones.save(c);

        crearNotif(c.getUsuario(), TipoNotificacion.ASIGNADO_A_SUBASTA, "Tu bien fue asignado a una subasta",
                "«" + c.getDescripcion() + "» fue incluido en la subasta «" + s.getTitulo()
                        + "» (" + s.getFechaHoraInicio() + ").", c.getId());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("consignacionId", c.getId());
        resp.put("estado", c.getEstado().name());
        resp.put("piezaId", p.getId());
        resp.put("subastaId", s.getId());
        resp.put("subastaTitulo", s.getTitulo());
        resp.put("fechaSubasta", String.valueOf(s.getFechaHoraInicio()));
        return ResponseEntity.ok(resp);
    }

    /**
     * Empresa: marca la pieza como vendida (cierre de subasta).
     * EN_SUBASTA → VENDIDO
     */
    @PatchMapping("/consignments/{id}/mark-sold")
    public ResponseEntity<?> markSold(@PathVariable String id) {
        return consignaciones.findById(id).map(c -> {
            if (c.getEstado() != EstadoConsignacion.EN_SUBASTA) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "La consignación no está en subasta"));
            }
            c.setEstado(EstadoConsignacion.VENDIDO);
            consignaciones.save(c);
            return ResponseEntity.ok(Map.of("estado", c.getEstado().name()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // =================================================================
    // Helper
    // =================================================================

    private void crearNotif(Usuario u, TipoNotificacion tipo, String asunto, String cuerpo, String referenciaId) {
        notificaciones.save(Notificacion.builder()
                .usuario(u).tipo(tipo).asunto(asunto).cuerpo(cuerpo).referenciaId(referenciaId)
                .build());
    }
}
