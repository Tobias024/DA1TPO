package com.subastapp.controller;

import com.subastapp.model.MedioPago;
import com.subastapp.model.Pieza;
import com.subastapp.model.Usuario;
import com.subastapp.model.Venta;
import com.subastapp.model.enums.EstadoPieza;
import com.subastapp.model.enums.TipoMedioPago;
import com.subastapp.repository.MedioPagoRepository;
import com.subastapp.repository.VentaRepository;
import com.subastapp.util.VentaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Flujo de compra "centrado en la Venta": la Venta la crea el scheduler al
 * ADJUDICAR la pieza (cuando vence su ventana de puja y hay ganador). Acá el
 * ganador la lista, ve el checkout y confirma el pago dentro del plazo.
 */
@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class VentaController {

    private final VentaRepository ventas;
    private final MedioPagoRepository mediosPago;

    private static final BigDecimal COMISION_RATE = new BigDecimal("0.10");
    private static final BigDecimal COSTO_ENVIO = new BigDecimal("5000");

    /** Lista las ventas del usuario (adjudicadas/pagadas/impagas). */
    @GetMapping("/won")
    @Transactional(readOnly = true)
    public ResponseEntity<?> ganadas(@AuthenticationPrincipal Usuario usuario) {
        LocalDateTime now = LocalDateTime.now();
        var lista = ventas.findByCompradorIdAndEstadoPagoInOrderByFechaVentaDesc(
                usuario.getId(), List.of("PENDIENTE_PAGO", "PAGADO", "INCUMPLIDO"));

        List<Map<String, Object>> out = new ArrayList<>();
        for (Venta v : lista) {
            Pieza p = v.getPieza();
            boolean vencido = "PENDIENTE_PAGO".equals(v.getEstadoPago())
                    && v.getFechaLimitePago() != null && now.isAfter(v.getFechaLimitePago());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ventaId", v.getId());
            m.put("piezaId", p != null ? p.getId() : null);
            m.put("subastaId", v.getSubasta() != null ? v.getSubasta().getId() : null);
            m.put("descripcion", p != null ? p.getDescripcion() : null);
            m.put("imagen", (p != null && !p.getImagenes().isEmpty()) ? p.getImagenes().get(0) : null);
            m.put("montoGanador", v.getMontoOfertado());
            m.put("moneda", v.getMoneda());
            m.put("estadoPago", v.getEstadoPago());
            m.put("fechaLimitePago", v.getFechaLimitePago());
            m.put("vencido", vencido);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /** Detalle de checkout de una pieza adjudicada (precio, comisión, envío, total). */
    @GetMapping("/won/{piezaId}/checkout")
    @Transactional(readOnly = true)
    public ResponseEntity<?> checkout(@AuthenticationPrincipal Usuario usuario,
                                      @PathVariable String piezaId) {
        Venta v = ventas.findByPiezaId(piezaId).orElse(null);
        if (v == null) return ResponseEntity.notFound().build();
        if (v.getComprador() == null || !v.getComprador().getId().equals(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Esta compra no es tuya"));
        }
        if ("INCUMPLIDO".equals(v.getEstadoPago())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "El plazo de pago venció. Tenés una multa pendiente; regularizala para continuar.",
                    "estadoPago", "INCUMPLIDO", "redirect", "fine"));
        }

        BigDecimal precioFinal = v.getMontoOfertado();
        BigDecimal comision = precioFinal.multiply(COMISION_RATE).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ventaId", v.getId());
        resp.put("piezaId", piezaId);
        resp.put("descripcion", v.getPieza() != null ? v.getPieza().getDescripcion() : null);
        resp.put("moneda", v.getMoneda());
        resp.put("precioFinal", precioFinal);
        resp.put("comision", comision);
        resp.put("costoEnvio", COSTO_ENVIO);
        resp.put("totalEnvio", precioFinal.add(comision).add(COSTO_ENVIO));
        resp.put("totalRetiro", precioFinal.add(comision));
        resp.put("estadoPago", v.getEstadoPago());
        resp.put("fechaLimitePago", v.getFechaLimitePago());
        return ResponseEntity.ok(resp);
    }

    /** Confirma el pago de una venta PENDIENTE_PAGO dentro del plazo. */
    @PostMapping("/won/{piezaId}/pay")
    @Transactional
    public ResponseEntity<?> pagar(@AuthenticationPrincipal Usuario usuario,
                                   @PathVariable String piezaId,
                                   @RequestBody Map<String, Object> body) {
        Venta v = ventas.findByPiezaId(piezaId).orElse(null);
        if (v == null) return ResponseEntity.notFound().build();
        if (v.getComprador() == null || !v.getComprador().getId().equals(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Esta compra no es tuya"));
        }
        if ("PAGADO".equals(v.getEstadoPago())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Esta pieza ya fue pagada"));
        }
        if ("INCUMPLIDO".equals(v.getEstadoPago())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "El plazo de pago venció. Se aplicó una multa; regularizala para volver a participar.",
                    "estadoPago", "INCUMPLIDO", "redirect", "fine"));
        }
        // Plazo vencido pero el scheduler aún no multó: rechazamos SIN multar (el
        // scheduler es el único que aplica la multa, para no duplicarla).
        if (v.getFechaLimitePago() != null && LocalDateTime.now().isAfter(v.getFechaLimitePago())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "El plazo de pago venció.", "redirect", "fine"));
        }

        String medioPagoId = (String) body.get("medioPagoId");
        if (medioPagoId == null || medioPagoId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "medioPagoId es requerido"));
        }
        MedioPago medio = mediosPago.findById(medioPagoId).orElse(null);
        if (medio == null || medio.getUsuario() == null
                || !medio.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Medio de pago inválido"));
        }
        if (!medio.isVerificado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "El medio de pago no está verificado"));
        }

        boolean retira = Boolean.TRUE.equals(body.get("retiraPersonalmente"));
        String direccionEnvio = (String) body.get("direccionEnvio");
        if (!retira && (direccionEnvio == null || direccionEnvio.isBlank())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La dirección de envío es requerida si no retirás en persona"));
        }

        BigDecimal precioFinal = v.getMontoOfertado();
        BigDecimal comision = precioFinal.multiply(COMISION_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal costoEnvio = retira ? BigDecimal.ZERO : COSTO_ENVIO;
        BigDecimal total = precioFinal.add(comision).add(costoEnvio);

        if (medio.getTipo() == TipoMedioPago.CHEQUE_CERTIFICADO) {
            if (medio.getMontoDisponibleCheque().compareTo(total) < 0) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of("error", "El cheque no tiene saldo suficiente"));
            }
            BigDecimal usado = medio.getMontoUsado() != null ? medio.getMontoUsado() : BigDecimal.ZERO;
            medio.setMontoUsado(usado.add(total));
        }

        v.setMedioPago(medio);
        v.setComision(comision);
        v.setCostoEnvio(costoEnvio);
        v.setTotalAPagar(total);
        v.setRetiraPersonalmente(retira);
        v.setDireccionEnvio(retira ? null : direccionEnvio);
        v.setEstadoPago("PAGADO");

        Pieza p = v.getPieza();
        if (p != null) p.setEstado(EstadoPieza.VENDIDO); // managed → dirty check

        return ResponseEntity.ok(Map.of("message", "Pago confirmado", "venta", VentaMapper.toDto(v)));
    }
}
