package com.subastapp.controller;

import com.subastapp.model.MedioPago;
import com.subastapp.model.Notificacion;
import com.subastapp.model.Usuario;
import com.subastapp.repository.MedioPagoRepository;
import com.subastapp.repository.NotificacionRepository;
import com.subastapp.repository.UsuarioRepository;
import com.subastapp.repository.VentaRepository;
import com.subastapp.repository.PujaRepository;
import com.subastapp.util.VentaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UsuarioController {

    private final NotificacionRepository notificacionRepository;
    private final VentaRepository ventaRepository;
    private final PujaRepository pujaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MedioPagoRepository medioPagoRepository;

    @GetMapping("/users/me")
    public ResponseEntity<?> perfil(@AuthenticationPrincipal Usuario usuario) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", usuario.getId());
        resp.put("nombre", usuario.getNombre());
        resp.put("apellido", usuario.getApellido());
        resp.put("email", usuario.getEmail());
        resp.put("domicilioLegal", usuario.getDomicilioLegal());
        resp.put("paisOrigen", usuario.getPaisOrigen());
        resp.put("categoria", usuario.getCategoria());
        resp.put("estado", usuario.getEstado());
        resp.put("tieneMulta", usuario.isTieneMulta());
        resp.put("montoPendienteMulta", usuario.getMontoPendienteMulta());
        return ResponseEntity.ok(resp);
    }

    /** Regulariza/paga la multa pendiente del usuario (libera el bloqueo para pujar/unirse). */
    @PostMapping("/users/me/fine/pay")
    public ResponseEntity<?> pagarMulta(@AuthenticationPrincipal Usuario usuario,
                                        @RequestBody(required = false) Map<String, Object> body) {
        if (!usuario.isTieneMulta()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "No tenés multa pendiente"));
        }
        if (body != null) {
            String medioPagoId = (String) body.get("medioPagoId");
            if (medioPagoId != null && !medioPagoId.isBlank()) {
                MedioPago medio = medioPagoRepository.findById(medioPagoId).orElse(null);
                if (medio == null || medio.getUsuario() == null
                        || !medio.getUsuario().getId().equals(usuario.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Medio de pago inválido"));
                }
            }
        }
        usuario.setTieneMulta(false);
        usuario.setMontoPendienteMulta(null);
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("message", "Multa regularizada", "tieneMulta", false));
    }

    @GetMapping("/users/me/metrics")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> metricas(@AuthenticationPrincipal Usuario usuario) {
        var ventas = ventaRepository.findByCompradorIdOrderByFechaVentaDesc(usuario.getId());
        var pujas = pujaRepository.findByPostorId(usuario.getId());

        double totalGastado = ventas.stream()
                .filter(v -> "PAGADO".equals(v.getEstadoPago()))
                .mapToDouble(v -> v.getTotalAPagar() != null ? v.getTotalAPagar().doubleValue() : 0)
                .sum();
        // Ganadas = adjudicadas no incumplidas (PAGADO o PENDIENTE_PAGO); las impagas
        // (INCUMPLIDO) no cuentan como subasta ganada.
        long ganadas = ventas.stream()
                .filter(v -> !"INCUMPLIDO".equals(v.getEstadoPago()))
                .count();

        // Participación = subastas distintas en las que el usuario pujó.
        var subastasParticipadas = pujas.stream()
                .map(p -> p.getSubasta() != null ? p.getSubasta().getId() : null)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        long participadas = subastasParticipadas.size();

        double mayorPuja = pujas.stream()
                .mapToDouble(p -> p.getMonto() != null ? p.getMonto().doubleValue() : 0)
                .max().orElse(0);

        double tasaExito = participadas > 0 ? (double) ganadas / participadas : 0;

        // Categorías: subastas distintas por categoría requerida.
        Map<String, java.util.Set<String>> porCategoria = new LinkedHashMap<>();
        for (var p : pujas) {
            if (p.getSubasta() == null) continue;
            String cat = p.getSubasta().getCategoriaRequerida().name();
            porCategoria.computeIfAbsent(cat, k -> new java.util.HashSet<>()).add(p.getSubasta().getId());
        }
        var categorias = porCategoria.entrySet().stream()
                .map(e -> Map.of("categoria", (Object) e.getKey(), "participaciones", e.getValue().size()))
                .toList();

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("totalGastado", totalGastado);
        resp.put("subastasParticipadas", participadas);
        resp.put("subastasGanadas", ganadas);
        resp.put("tasaExito", tasaExito);
        resp.put("mayorPuja", mayorPuja);
        resp.put("categorias", categorias);
        return ResponseEntity.ok(resp);
    }

    // ----- NOTIFICATIONS -----
    @GetMapping("/notifications")
    public ResponseEntity<Page<Notificacion>> notificaciones(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Notificacion> nots = notificacionRepository.findByUsuarioIdOrderByFechaEnvioDesc(
                usuario.getId(), PageRequest.of(page, size));
        return ResponseEntity.ok(nots);
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> marcarLeida(@PathVariable String id,
                                          @AuthenticationPrincipal Usuario usuario) {
        return notificacionRepository.findById(id)
                .filter(n -> n.getUsuario().getId().equals(usuario.getId()))
                .map(n -> {
                    n.setLeido(true);
                    notificacionRepository.save(n);
                    return ResponseEntity.ok(Map.of("message", "Notificación marcada como leída"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ----- SALES / PURCHASE HISTORY -----
    @GetMapping("/sales")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> misCompras(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(VentaMapper.toDtoList(
                ventaRepository.findByCompradorIdOrderByFechaVentaDesc(usuario.getId())));
    }
}
