package com.subastapp.controller;

import com.subastapp.model.Pieza;
import com.subastapp.model.Subasta;
import com.subastapp.model.Usuario;
import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoSubasta;
import com.subastapp.repository.MedioPagoRepository;
import com.subastapp.repository.SubastaRepository;
import com.subastapp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/auctions")
@RequiredArgsConstructor
public class SubastaController {

    private final SubastaRepository subastaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MedioPagoRepository medioPagoRepository;

    @GetMapping
    public ResponseEntity<?> listarSubastas(
            @RequestParam(required = false) EstadoSubasta estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Usuario usuario) {

        CategoriaUsuario cat = usuario.getCategoria();
        // User can see auctions up to and including their own category
        List<CategoriaUsuario> accesibles = Arrays.stream(CategoriaUsuario.values())
                .filter(c -> c.ordinal() <= cat.ordinal())
                .toList();

        var pageable = PageRequest.of(page, size);
        var result = (estado != null)
                ? subastaRepository.findByEstadoAndCategoriaRequeridaIn(estado, accesibles, pageable)
                : subastaRepository.findByCategoriaRequeridaIn(accesibles, pageable);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalleSubasta(@PathVariable String id,
                                             @AuthenticationPrincipal Usuario usuario) {
        return subastaRepository.findById(id)
                .map(subasta -> {
                    boolean puedePujar = medioPagoRepository.existsByUsuarioIdAndVerificadoTrue(usuario.getId())
                            && usuario.getCategoria().puedeAcceder(subasta.getCategoriaRequerida());
                    boolean puedeParticipar = usuario.getCategoria().puedeAcceder(subasta.getCategoriaRequerida());

                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("id", subasta.getId());
                    response.put("titulo", subasta.getTitulo());
                    response.put("descripcion", subasta.getDescripcion());
                    response.put("fechaHoraInicio", subasta.getFechaHoraInicio());
                    response.put("ubicacion", subasta.getUbicacion());
                    response.put("categoriaRequerida", subasta.getCategoriaRequerida());
                    response.put("moneda", subasta.getMoneda());
                    response.put("estado", subasta.getEstado());
                    response.put("streamingUrl", subasta.getStreamingUrl());
                    response.put("usuarioPuedeParticipar", puedeParticipar);
                    response.put("usuarioPuedePujar", puedePujar);
                    response.put("motivoNoPuede", puedePujar ? null :
                            !puedeParticipar ? "Categoría insuficiente" : "Sin medios de pago verificados");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Estado en vivo de la subasta: item actual + mejor oferta + límites (fallback de polling del WebSocket). */
    @GetMapping("/{id}/state")
    @Transactional(readOnly = true)
    public ResponseEntity<?> estadoEnVivo(@PathVariable String id,
                                          @AuthenticationPrincipal Usuario usuario) {
        return subastaRepository.findById(id).map(subasta -> {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("estado", subasta.getEstado());
            resp.put("moneda", subasta.getMoneda());
            Pieza item = subasta.getItemActual();
            if (item != null) {
                Map<String, Object> it = new LinkedHashMap<>();
                it.put("id", item.getId());
                it.put("descripcion", item.getDescripcion());
                it.put("precioBase", item.getPrecioBase());
                it.put("mejorOferta", item.getMejorOferta());
                it.put("imagenes", item.getImagenes());
                it.put("limiteMinimo", item.calcularLimiteMinimoPuja());
                it.put("limiteMaximo", item.calcularLimiteMaximoPuja());
                resp.put("itemActual", it);
            } else {
                resp.put("itemActual", null);
            }
            return ResponseEntity.ok(resp);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/catalog")
    public ResponseEntity<?> catalogo(@PathVariable String id,
                                       @AuthenticationPrincipal Usuario usuario) {
        return subastaRepository.findById(id)
                .map(subasta -> {
                    if (!usuario.getCategoria().puedeAcceder(subasta.getCategoriaRequerida())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Categoría insuficiente para ver esta subasta");
                    }
                    return ResponseEntity.ok(subasta.getCatalogo());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> unirseSubasta(@PathVariable String id,
                                             @AuthenticationPrincipal Usuario usuario) {
        if (usuario.isTieneMulta()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Tenés una multa pendiente. Regularizá tu situación para continuar."));
        }
        if (usuario.getSubastaActivaId() != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Ya está conectado a otra subasta. Debe desconectarse primero."));
        }

        return subastaRepository.findById(id)
                .map(subasta -> {
                    if (!usuario.getCategoria().puedeAcceder(subasta.getCategoriaRequerida())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Categoría insuficiente para acceder a esta subasta"));
                    }
                    usuario.setSubastaActivaId(id);
                    usuarioRepository.save(usuario);
                    boolean puedePujar = medioPagoRepository.existsByUsuarioIdAndVerificadoTrue(usuario.getId());
                    return ResponseEntity.ok(Map.of(
                            "message", "Conectado exitosamente",
                            "puedePujar", puedePujar
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> salirSubasta(@PathVariable String id,
                                           @AuthenticationPrincipal Usuario usuario) {
        usuario.setSubastaActivaId(null);
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("message", "Desconectado de la subasta"));
    }
}
