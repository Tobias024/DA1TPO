package com.subastapp.controller;

import com.subastapp.model.Notificacion;
import com.subastapp.model.Usuario;
import com.subastapp.repository.NotificacionRepository;
import com.subastapp.repository.VentaRepository;
import com.subastapp.repository.PujaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UsuarioController {

    private final NotificacionRepository notificacionRepository;
    private final VentaRepository ventaRepository;
    private final PujaRepository pujaRepository;

    @GetMapping("/users/me")
    public ResponseEntity<?> perfil(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "nombre", usuario.getNombre(),
                "apellido", usuario.getApellido(),
                "email", usuario.getEmail(),
                "domicilioLegal", usuario.getDomicilioLegal(),
                "paisOrigen", usuario.getPaisOrigen(),
                "categoria", usuario.getCategoria(),
                "estado", usuario.getEstado(),
                "tieneMulta", usuario.isTieneMulta()
        ));
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
                "historialCompras", ventas
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
        return ResponseEntity.ok(ventaRepository.findByCompradorIdOrderByFechaVentaDesc(usuario.getId()));
    }
}
