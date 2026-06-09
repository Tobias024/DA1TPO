package com.subastapp.controller;

import com.subastapp.model.*;
import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoSubasta;
import com.subastapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auctions/{auctionId}/bids")
@RequiredArgsConstructor
public class PujaController {

    private final SubastaRepository subastaRepository;
    private final PujaRepository pujaRepository;
    private final MedioPagoRepository medioPagoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<?> historialPujas(
            @PathVariable String auctionId,
            @RequestParam(required = false) String piezaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        // Con piezaId: solo el historial de ESE ítem (así la mejor oferta mostrada
        // coincide con el historial). Sin piezaId: historial de toda la subasta.
        if (piezaId != null && !piezaId.isBlank()) {
            var lista = pujaRepository.findBySubastaIdAndPiezaIdOrderByTimestampAsc(auctionId, piezaId);
            return ResponseEntity.ok(Map.of("content", lista));
        }
        var pujas = pujaRepository.findBySubastaIdOrderByTimestampAsc(
                auctionId, PageRequest.of(page, size));
        return ResponseEntity.ok(pujas);
    }

    @PostMapping
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<?> realizarPuja(
            @PathVariable String auctionId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Usuario postor) {

        // 1. Check for pending unconfirmed bids (one-at-a-time rule)
        long pendientes = pujaRepository.countByPostorIdAndConfirmadaFalse(postor.getId());
        if (pendientes > 0) {
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(Map.of("error", "Puja anterior aún procesándose. Por favor espere la confirmación."));
        }

        // 2. Check penalty
        if (postor.isTieneMulta()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Tiene una multa pendiente. Debe abonarla antes de continuar."));
        }

        // 3. Get auction
        Subasta subasta = subastaRepository.findById(auctionId).orElse(null);
        if (subasta == null) return ResponseEntity.notFound().build();
        if (subasta.getEstado() != EstadoSubasta.EN_CURSO) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "La subasta no está en curso"));
        }

        // 4. Check category
        if (!postor.getCategoria().puedeAcceder(subasta.getCategoriaRequerida())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Categoría insuficiente para pujar en esta subasta"));
        }

        // 5. Get payment method
        String medioPagoId = (String) body.get("medioPagoId");
        MedioPago medioPago = medioPagoRepository.findById(medioPagoId).orElse(null);
        if (medioPago == null || !medioPago.isVerificado()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Medio de pago inválido o no verificado"));
        }

        // 6. Resolver el ítem a pujar: el seleccionado (piezaId) o, si no vino, el item actual.
        String piezaId = (String) body.get("piezaId");
        Pieza pieza = null;
        if (piezaId != null) {
            pieza = subasta.getCatalogo().stream()
                    .filter(p -> p.getId().equals(piezaId)).findFirst().orElse(null);
        }
        if (pieza == null) pieza = subasta.getItemActual();
        if (pieza == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "No hay item activo en esta subasta"));
        }

        // 6b. Validar la ventana de tiempo del ítem (cada lote se remata en su horario).
        String estadoPuja = pieza.getEstadoPujaJson();
        if ("CERRADO".equals(estadoPuja)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "La puja de este ítem ya cerró"));
        }
        if ("PROXIMO".equals(estadoPuja)) {
            Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("error", "La puja de este ítem todavía no abrió");
            resp.put("abrePuja", pieza.getInicioPuja());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(resp);
        }

        // 7. Validate bid amount
        BigDecimal monto = new BigDecimal(body.get("monto").toString());
        BigDecimal minimo = pieza.calcularLimiteMinimoPuja();
        BigDecimal maximo = pieza.calcularLimiteMaximoPuja();

        // Limits don't apply to ORO and PLATINO auctions
        boolean aplicanLimites = subasta.getCategoriaRequerida() != CategoriaUsuario.ORO
                && subasta.getCategoriaRequerida() != CategoriaUsuario.PLATINO;

        if (aplicanLimites && monto.compareTo(minimo) < 0) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("error",
                            "El monto mínimo para pujar es " + minimo,
                            "limiteMinimo", minimo,
                            "limiteMaximo", maximo));
        }
        if (aplicanLimites && monto.compareTo(maximo) > 0) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("error",
                            "El monto máximo para pujar es " + maximo,
                            "limiteMinimo", minimo,
                            "limiteMaximo", maximo));
        }

        // 7. Check certified check funds
        if (medioPago.getTipo() == com.subastapp.model.enums.TipoMedioPago.CHEQUE_CERTIFICADO) {
            if (monto.compareTo(medioPago.getMontoDisponibleCheque()) > 0) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of("error", "Fondos insuficientes en el cheque certificado"));
            }
        }

        // 8. Register bid (unconfirmed)
        Puja puja = Puja.builder()
                .monto(monto)
                .postor(postor)
                .pieza(pieza)
                .subasta(subasta)
                .medioPago(medioPago)
                .confirmada(false)
                .build();
        puja = pujaRepository.save(puja);

        // 9. Update current highest bid
        pieza.setMejorOferta(monto);
        pieza.setMejorPostor(postor);

        // 10. Confirm bid
        puja.setConfirmada(true);
        pujaRepository.save(puja);

        // 11. Notify all connected users via WebSocket
        String alias = "Postor ***" + postor.getId().substring(postor.getId().length() - 2);
        messagingTemplate.convertAndSend("/topic/auctions/" + auctionId, Map.of(
                "tipo", "NUEVA_PUJA",
                "data", Map.of(
                        "monto", monto,
                        "postorAlias", alias,
                        "timestamp", puja.getTimestamp(),
                        "limiteMinimo", pieza.calcularLimiteMinimoPuja(),
                        "limiteMaximo", pieza.calcularLimiteMaximoPuja()
                )
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", puja.getId(),
                "monto", monto,
                "timestamp", puja.getTimestamp(),
                "estado", "CONFIRMADA",
                "esMejorOferta", true
        ));
    }
}
