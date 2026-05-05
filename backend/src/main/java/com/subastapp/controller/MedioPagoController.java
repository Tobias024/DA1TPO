package com.subastapp.controller;

import com.subastapp.model.MedioPago;
import com.subastapp.model.Usuario;
import com.subastapp.model.enums.Moneda;
import com.subastapp.model.enums.TipoMedioPago;
import com.subastapp.repository.MedioPagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment-methods")
@RequiredArgsConstructor
public class MedioPagoController {

    private final MedioPagoRepository medioPagoRepository;

    @GetMapping
    public ResponseEntity<List<MedioPago>> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(medioPagoRepository.findByUsuarioId(usuario.getId()));
    }

    @PostMapping
    public ResponseEntity<?> agregar(@RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal Usuario usuario) {
        TipoMedioPago tipo;
        try {
            tipo = TipoMedioPago.valueOf((String) body.get("tipo"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo de medio de pago inválido"));
        }

        MedioPago medioPago = MedioPago.builder()
                .usuario(usuario)
                .tipo(tipo)
                .moneda(Moneda.valueOf((String) body.getOrDefault("moneda", "ARS")))
                .banco((String) body.get("banco"))
                .numeroCuenta((String) body.get("numeroCuenta"))
                .cbu((String) body.get("cbu"))
                .swift((String) body.get("swift"))
                .ultimosDigitosTarjeta((String) body.get("numeroTarjeta"))
                .titularTarjeta((String) body.get("titular"))
                .vencimientoTarjeta((String) body.get("vencimiento"))
                .montoCheque(body.get("montoCheque") != null ?
                        new BigDecimal(body.get("montoCheque").toString()) : null)
                .numeroCheque((String) body.get("numeroCheque"))
                // La verificación efectiva queda a cargo de la empresa subastadora
                // (sistema externo, fuera de scope de esta entrega). Default `true`.
                .verificado(true)
                .build();

        medioPagoRepository.save(medioPago);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Medio de pago agregado.",
                        "id", medioPago.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable String id,
                                       @AuthenticationPrincipal Usuario usuario) {
        return medioPagoRepository.findById(id)
                .filter(mp -> mp.getUsuario().getId().equals(usuario.getId()))
                .map(mp -> {
                    medioPagoRepository.delete(mp);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
