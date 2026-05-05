package com.subastapp.controller;

import com.subastapp.model.Consignacion;
import com.subastapp.model.Usuario;
import com.subastapp.model.enums.EstadoConsignacion;
import com.subastapp.repository.ConsignacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/consignments")
@RequiredArgsConstructor
public class ConsignacionController {

    private final ConsignacionRepository consignacionRepository;

    @GetMapping
    public ResponseEntity<List<Consignacion>> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(consignacionRepository.findByUsuarioIdOrderByFechaSolicitudDesc(usuario.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalle(@PathVariable String id,
                                      @AuthenticationPrincipal Usuario usuario) {
        return consignacionRepository.findById(id)
                .filter(c -> c.getUsuario().getId().equals(usuario.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> solicitar(@RequestBody Map<String, Object> body,
                                        @AuthenticationPrincipal Usuario usuario) {
        Boolean declaraPropiedad = (Boolean) body.get("declaraPropiedad");
        Boolean declaraOrigenLicito = (Boolean) body.get("declaraOrigenLicito");

        if (!Boolean.TRUE.equals(declaraPropiedad) || !Boolean.TRUE.equals(declaraOrigenLicito)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Debe declarar que el bien es de su propiedad y acreditar su origen lícito"));
        }

        @SuppressWarnings("unchecked")
        List<String> fotos = (List<String>) body.get("fotos");
        if (fotos == null || fotos.size() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Debe adjuntar al menos 6 fotografías del bien"));
        }

        Consignacion consignacion = Consignacion.builder()
                .usuario(usuario)
                .tipoBien((String) body.get("tipoBien"))
                .descripcion((String) body.get("descripcion"))
                .categoria((String) body.get("categoria"))
                .fechaAdquisicion((String) body.get("fechaAdquisicion"))
                .artista((String) body.get("artista"))
                .historia((String) body.get("historia"))
                .declaraPropiedad(true)
                .declaraOrigenLicito(true)
                .fotos(fotos)
                .estado(EstadoConsignacion.PENDIENTE)
                .build();

        consignacionRepository.save(consignacion);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", consignacion.getId(),
                        "message", "Solicitud enviada. La empresa revisará su bien y le informará."
                ));
    }

    @PatchMapping("/{id}/accept-offer")
    public ResponseEntity<?> aceptarOferta(@PathVariable String id,
                                             @AuthenticationPrincipal Usuario usuario) {
        return consignacionRepository.findById(id)
                .filter(c -> c.getUsuario().getId().equals(usuario.getId()))
                .map(c -> {
                    if (c.getEstado() != EstadoConsignacion.PENDIENTE_CONFIRMACION_USUARIO) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("error", "No hay oferta pendiente de aceptación"));
                    }
                    c.setEstado(EstadoConsignacion.EN_SUBASTA);
                    consignacionRepository.save(c);
                    return ResponseEntity.ok(Map.of("message", "Oferta aceptada. El bien quedará incluido en la subasta."));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject-offer")
    public ResponseEntity<?> rechazarOferta(@PathVariable String id,
                                              @RequestBody(required = false) Map<String, String> body,
                                              @AuthenticationPrincipal Usuario usuario) {
        return consignacionRepository.findById(id)
                .filter(c -> c.getUsuario().getId().equals(usuario.getId()))
                .map(c -> {
                    if (c.getEstado() != EstadoConsignacion.PENDIENTE_CONFIRMACION_USUARIO) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("error", "No hay oferta pendiente"));
                    }
                    c.setEstado(EstadoConsignacion.DEVUELTO);
                    consignacionRepository.save(c);
                    return ResponseEntity.ok(Map.of("message", "Oferta rechazada. Se procederá a la devolución con cargo."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
