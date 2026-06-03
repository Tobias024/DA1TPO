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
    public ResponseEntity<?> metricas(@AuthenticationPrincipal Usuario usuario) {
        var ventas = ventaRepository.findByCompradorIdOrderByFechaVentaDesc(usuario.getId());
        long ganadas = ventas.size();
        var totalPagado = ventas.stream()
                .filter(v -> "PAGADO".equals(v.getEstadoPago()))
                .mapToDouble(v -> v.getTotalAPagar() != null ? v.getTotalAPagar().doubleValue() : 0)
                .sum();

        return ResponseEntity.ok(Map.of(
                "totalSubastasGanadas", ganadas,
                "importeTotalPagado", totalPagado,
                "historialCompras", VentaMapper.toDtoList(ventas)
        ));
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
    public ResponseEntity<?> misCompras(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(VentaMapper.toDtoList(
                ventaRepository.findByCompradorIdOrderByFechaVentaDesc(usuario.getId())));
    }
}
