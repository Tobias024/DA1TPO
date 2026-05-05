package com.subastapp.controller;

import com.subastapp.model.Consignacion;
import com.subastapp.model.enums.EstadoConsignacion;
import com.subastapp.repository.ConsignacionRepository;
import com.subastapp.repository.SubastaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Endpoints administrativos para simular el lado "empresa subastadora"
 * (sistema externo legacy fuera de scope de la app móvil).
 *
 * Solo activo con perfil `dev`. Permiten flipear estados de consignaciones
 * desde Bruno/Postman sin necesidad de un panel admin real.
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

    /**
     * Empresa: empieza la inspección física de la consignación.
     * PENDIENTE → EN_INSPECCION
     */
    @PatchMapping("/consignments/{id}/start-inspection")
    public ResponseEntity<?> startInspection(@PathVariable String id) {
        return consignaciones.findById(id).map(c -> {
            c.setEstado(EstadoConsignacion.EN_INSPECCION);
            consignaciones.save(c);
            return ResponseEntity.ok(Map.of(
                    "id", c.getId(),
                    "estado", c.getEstado().name(),
                    "message", "Consignación pasó a inspección."
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Empresa: aceptó el bien tras inspección y propone valor base + comisión.
     * EN_INSPECCION → PENDIENTE_CONFIRMACION_USUARIO
     *
     * Body: { "precioBaseOfrecido": 250000, "comision": 0.15, "subastaId": "..." (opcional) }
     */
    @PatchMapping("/consignments/{id}/propose")
    public ResponseEntity<?> propose(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return consignaciones.findById(id).map(c -> {
            BigDecimal precio = body.get("precioBaseOfrecido") != null
                    ? new BigDecimal(body.get("precioBaseOfrecido").toString()) : null;
            BigDecimal comision = body.get("comision") != null
                    ? new BigDecimal(body.get("comision").toString()) : null;
            String subastaId = (String) body.get("subastaId");

            if (precio == null || comision == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "precioBaseOfrecido y comision son requeridos"
                ));
            }

            c.setPrecioBaseOfrecido(precio);
            c.setComision(comision);
            if (subastaId != null) {
                subastas.findById(subastaId).ifPresent(c::setSubastaAsignada);
            }
            c.setEstado(EstadoConsignacion.PENDIENTE_CONFIRMACION_USUARIO);
            consignaciones.save(c);

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

            return ResponseEntity.ok(Map.of(
                    "id", c.getId(),
                    "estado", c.getEstado().name(),
                    "causaRechazo", c.getCausaRechazo(),
                    "gastosDevolucion", c.getGastosDevolucion()
            ));
        }).orElse(ResponseEntity.notFound().build());
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
}
