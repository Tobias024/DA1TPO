package com.subastapp.controller;

import com.subastapp.model.Consignacion;
import com.subastapp.model.Notificacion;
import com.subastapp.model.Usuario;
import com.subastapp.model.enums.EstadoConsignacion;
import com.subastapp.model.enums.TipoNotificacion;
import com.subastapp.repository.ConsignacionRepository;
import com.subastapp.repository.NotificacionRepository;
import com.subastapp.util.ConsignacionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/consignments")
@RequiredArgsConstructor
public class ConsignacionController {

    private final ConsignacionRepository consignacionRepository;
    private final NotificacionRepository notificaciones;

    /** Dirección a la que el usuario debe enviar su bien tras crear la solicitud. */
    private static final String DEPOSITO_DEFAULT =
            "Depósito Central — Av. de los Constituyentes 1234, CABA";
    /** Costo de devolución por defecto cuando el usuario rechaza la oferta. */
    private static final BigDecimal COSTO_ENVIO_DEFAULT = new BigDecimal("4500");
    /** Días estimados de llegada del bien devuelto. */
    private static final int DIAS_LLEGADA_ESTIMADA = 7;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> listar(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(ConsignacionMapper.toDtoList(
                consignacionRepository.findByUsuarioIdOrderByFechaSolicitudDesc(usuario.getId())));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> detalle(@PathVariable String id,
                                      @AuthenticationPrincipal Usuario usuario) {
        return consignacionRepository.findById(id)
                .filter(c -> c.getUsuario().getId().equals(usuario.getId()))
                .map(c -> ResponseEntity.ok(ConsignacionMapper.toDto(c)))
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

        // La app envía nombreBien/descripcionDetallada; Bruno/Swagger envían tipoBien/descripcion.
        // Aceptamos ambos para que el alta funcione desde los dos clientes (campos NOT NULL).
        String tipoBien = body.get("tipoBien") != null
                ? (String) body.get("tipoBien") : (String) body.get("nombreBien");
        String descripcion = body.get("descripcion") != null
                ? (String) body.get("descripcion") : (String) body.get("descripcionDetallada");
        if (tipoBien == null || descripcion == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Debe indicar el nombre y la descripción del bien"));
        }

        Consignacion consignacion = Consignacion.builder()
                .usuario(usuario)
                .tipoBien(tipoBien)
                .descripcion(descripcion)
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

        crearNotif(usuario, TipoNotificacion.CONSIGNACION_RECIBIDA, "Recibimos tu solicitud",
                "Enviá tu bien a: " + DEPOSITO_DEFAULT
                        + ". Cuando lo despaches, confirmá el envío desde la app.",
                consignacion.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", consignacion.getId(),
                        "deposito", DEPOSITO_DEFAULT,
                        "message", "Solicitud enviada. La empresa revisará su bien y le informará."
                ));
    }

    /**
     * Usuario: confirma que despachó el bien al depósito.
     * Flag liviano sobre la consignación PENDIENTE (no cambia el estado).
     */
    @PatchMapping("/{id}/confirm-shipment")
    public ResponseEntity<?> confirmarEnvio(@PathVariable String id,
                                             @AuthenticationPrincipal Usuario usuario) {
        return consignacionRepository.findById(id)
                .filter(c -> c.getUsuario().getId().equals(usuario.getId()))
                .map(c -> {
                    if (c.getEstado() != EstadoConsignacion.PENDIENTE) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("error", "Solo se puede confirmar el envío mientras la solicitud está pendiente"));
                    }
                    c.setEnvioConfirmado(true);
                    c.setFechaEnvio(LocalDateTime.now());
                    consignacionRepository.save(c);
                    return ResponseEntity.ok(Map.of(
                            "id", c.getId(),
                            "envioConfirmado", Boolean.TRUE,
                            "message", "Envío confirmado. Te avisaremos cuando lo recibamos."
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
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
                    c.setEstado(EstadoConsignacion.ACEPTADO);
                    consignacionRepository.save(c);

                    crearNotif(usuario, TipoNotificacion.CONSIGNACION_ACEPTADA, "Confirmaste el precio base",
                            "Confirmaste el precio base ofrecido. La empresa asignará tu bien a una subasta y te "
                                    + "avisaremos la fecha.", c.getId());

                    return ResponseEntity.ok(Map.of("message",
                            "Oferta aceptada. La empresa asignará tu bien a una subasta y te avisará."));
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
                    if (c.getGastosDevolucion() == null) {
                        c.setGastosDevolucion(COSTO_ENVIO_DEFAULT);
                    }
                    c.setEstado(EstadoConsignacion.DEVUELTO);
                    consignacionRepository.save(c);

                    LocalDateTime llegada = LocalDateTime.now().plusDays(DIAS_LLEGADA_ESTIMADA);
                    crearNotif(usuario, TipoNotificacion.BIEN_DEVUELTO, "Tu bien será devuelto",
                            "Rechazaste la oferta. Monto a pagar por el envío de devolución: $"
                                    + c.getGastosDevolucion().toPlainString()
                                    + ". Llegada estimada: " + llegada.toLocalDate() + ".",
                            c.getId());
                    return ResponseEntity.ok(Map.of("message", "Oferta rechazada. Se procederá a la devolución con cargo."));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void crearNotif(Usuario u, TipoNotificacion tipo, String asunto, String cuerpo, String referenciaId) {
        notificaciones.save(Notificacion.builder()
                .usuario(u).tipo(tipo).asunto(asunto).cuerpo(cuerpo).referenciaId(referenciaId)
                .build());
    }
}
