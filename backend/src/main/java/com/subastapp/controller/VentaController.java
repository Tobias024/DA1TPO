package com.subastapp.controller;

import com.subastapp.model.MedioPago;
import com.subastapp.model.Pieza;
import com.subastapp.model.Usuario;
import com.subastapp.model.Venta;
import com.subastapp.model.enums.EstadoPieza;
import com.subastapp.model.enums.EstadoSubasta;
import com.subastapp.model.enums.TipoMedioPago;
import com.subastapp.repository.MedioPagoRepository;
import com.subastapp.repository.PiezaRepository;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Flujo de compra de una pieza ganada: listar ganadas → checkout → confirmar pago.
 *
 * El ganador se deriva de la pieza (mejorPostor) en una subasta CERRADA; no depende
 * de ninguna acción del "lado empresa". La Venta solo se crea acá (antes solo la
 * generaba el seeder).
 */
@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class VentaController {

    private final PiezaRepository piezas;
    private final VentaRepository ventas;
    private final MedioPagoRepository mediosPago;

    /** Comisión que cobra la empresa al comprador (10% del precio final). */
    private static final BigDecimal COMISION_RATE = new BigDecimal("0.10");
    /** Costo de envío fijo cuando el comprador no retira en persona. */
    private static final BigDecimal COSTO_ENVIO = new BigDecimal("5000");

    /** Lista las piezas que el usuario ganó (mejor postor en una subasta cerrada). */
    @GetMapping("/won")
    @Transactional(readOnly = true)
    public ResponseEntity<?> ganadas(@AuthenticationPrincipal Usuario usuario) {
        List<Pieza> ganadas = piezas.findByMejorPostorIdAndSubastaEstado(
                usuario.getId(), EstadoSubasta.CERRADA);

        List<Map<String, Object>> out = new ArrayList<>();
        for (Pieza p : ganadas) {
            String estadoPago = ventas.findByPiezaId(p.getId())
                    .map(Venta::getEstadoPago).orElse("PENDIENTE_PAGO");
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("piezaId", p.getId());
            m.put("subastaId", p.getSubasta() != null ? p.getSubasta().getId() : null);
            m.put("descripcion", p.getDescripcion());
            m.put("imagen", p.getImagenes().isEmpty() ? null : p.getImagenes().get(0));
            m.put("montoGanador", p.getMejorOferta());
            m.put("moneda", p.getSubasta() != null ? p.getSubasta().getMoneda() : null);
            m.put("estadoPago", estadoPago);
            out.add(m);
        }
        return ResponseEntity.ok(out);
    }

    /** Detalle de checkout: precio final, comisión, envío y total (calculados en backend). */
    @GetMapping("/won/{piezaId}/checkout")
    @Transactional(readOnly = true)
    public ResponseEntity<?> checkout(@AuthenticationPrincipal Usuario usuario,
                                      @PathVariable String piezaId) {
        Pieza p = piezas.findById(piezaId).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        if (!esGanador(p, usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "No ganaste esta pieza o la subasta no está cerrada"));
        }

        BigDecimal precioFinal = p.getMejorOferta();
        BigDecimal comision = precioFinal.multiply(COMISION_RATE).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("piezaId", p.getId());
        resp.put("descripcion", p.getDescripcion());
        resp.put("moneda", p.getSubasta() != null ? p.getSubasta().getMoneda() : null);
        resp.put("precioFinal", precioFinal);
        resp.put("comision", comision);
        resp.put("costoEnvio", COSTO_ENVIO);
        resp.put("totalEnvio", precioFinal.add(comision).add(COSTO_ENVIO));
        resp.put("totalRetiro", precioFinal.add(comision));
        resp.put("estadoPago", ventas.findByPiezaId(p.getId())
                .map(Venta::getEstadoPago).orElse("PENDIENTE_PAGO"));
        return ResponseEntity.ok(resp);
    }

    /** Confirma el pago: valida medio, calcula montos en backend y crea/actualiza la Venta. */
    @PostMapping("/won/{piezaId}/pay")
    @Transactional
    public ResponseEntity<?> pagar(@AuthenticationPrincipal Usuario usuario,
                                   @PathVariable String piezaId,
                                   @RequestBody Map<String, Object> body) {
        Pieza p = piezas.findById(piezaId).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        if (!esGanador(p, usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "No ganaste esta pieza o la subasta no está cerrada"));
        }

        Venta existente = ventas.findByPiezaId(piezaId).orElse(null);
        if (existente != null && "PAGADO".equals(existente.getEstadoPago())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Esta pieza ya fue pagada"));
        }

        String medioPagoId = (String) body.get("medioPagoId");
        if (medioPagoId == null || medioPagoId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "medioPagoId es requerido"));
        }
        MedioPago medio = mediosPago.findById(medioPagoId).orElse(null);
        if (medio == null || medio.getUsuario() == null
                || !medio.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Medio de pago inválido"));
        }
        if (!medio.isVerificado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "El medio de pago no está verificado"));
        }

        boolean retira = Boolean.TRUE.equals(body.get("retiraPersonalmente"));
        String direccionEnvio = (String) body.get("direccionEnvio");
        if (!retira && (direccionEnvio == null || direccionEnvio.isBlank())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La dirección de envío es requerida si no retirás en persona"));
        }

        BigDecimal precioFinal = p.getMejorOferta();
        BigDecimal comision = precioFinal.multiply(COMISION_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal costoEnvio = retira ? BigDecimal.ZERO : COSTO_ENVIO;
        BigDecimal total = precioFinal.add(comision).add(costoEnvio);

        // Cheque certificado: validar y descontar el saldo disponible.
        if (medio.getTipo() == TipoMedioPago.CHEQUE_CERTIFICADO) {
            if (medio.getMontoDisponibleCheque().compareTo(total) < 0) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of("error", "El cheque no tiene saldo suficiente"));
            }
            BigDecimal usado = medio.getMontoUsado() != null ? medio.getMontoUsado() : BigDecimal.ZERO;
            medio.setMontoUsado(usado.add(total));
            mediosPago.save(medio);
        }

        Venta venta = existente != null ? existente : new Venta();
        venta.setPieza(p);
        venta.setComprador(usuario);
        venta.setSubasta(p.getSubasta());
        venta.setMedioPago(medio);
        venta.setMontoOfertado(precioFinal);
        venta.setComision(comision);
        venta.setCostoEnvio(costoEnvio);
        venta.setTotalAPagar(total);
        venta.setMoneda(p.getSubasta() != null ? p.getSubasta().getMoneda() : null);
        venta.setRetiraPersonalmente(retira);
        venta.setDireccionEnvio(retira ? null : direccionEnvio);
        venta.setEstadoPago("PAGADO");
        Venta saved = ventas.save(venta);

        p.setEstado(EstadoPieza.VENDIDO);
        piezas.save(p);

        return ResponseEntity.status(existente == null ? HttpStatus.CREATED : HttpStatus.OK)
                .body(Map.of("message", "Pago confirmado", "venta", VentaMapper.toDto(saved)));
    }

    private boolean esGanador(Pieza p, Usuario usuario) {
        return p.getMejorPostor() != null
                && p.getMejorPostor().getId().equals(usuario.getId())
                && p.getSubasta() != null
                && p.getSubasta().getEstado() == EstadoSubasta.CERRADA;
    }
}
