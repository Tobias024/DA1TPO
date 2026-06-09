package com.subastapp.scheduler;

import com.subastapp.model.Notificacion;
import com.subastapp.model.Pieza;
import com.subastapp.model.Subasta;
import com.subastapp.model.Usuario;
import com.subastapp.model.Venta;
import com.subastapp.model.enums.EstadoPieza;
import com.subastapp.model.enums.EstadoSubasta;
import com.subastapp.model.enums.TipoNotificacion;
import com.subastapp.repository.NotificacionRepository;
import com.subastapp.repository.PiezaRepository;
import com.subastapp.repository.SubastaRepository;
import com.subastapp.repository.UsuarioRepository;
import com.subastapp.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Cierre automático del ciclo de vida del ítem (perfil dev/demo):
 *  1) Ítems cuya ventana venció y tienen ganador → se ADJUDICAN: salen de
 *     disponibilidad y se crea una Venta PENDIENTE_PAGO con fecha límite.
 *  2) Ventas PENDIENTE_PAGO cuyo plazo venció sin pago → multa (10%) al ganador
 *     e INCUMPLIDO (en justicia). Único escritor de multas (el /pay no multa).
 *
 * Idempotente: la adjudicación se saltea si ya existe Venta para la pieza
 * (pieza_id unique); la multa filtra por estadoPago=PENDIENTE_PAGO y al pasar a
 * INCUMPLIDO no vuelve a entrar.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class SubastaScheduler {

    private final PiezaRepository piezas;
    private final VentaRepository ventas;
    private final UsuarioRepository usuarios;
    private final NotificacionRepository notificaciones;
    private final SubastaRepository subastas;

    @Value("${subastar.plazo-pago-minutos:5}")
    private long plazoPagoMinutos;

    private static final BigDecimal COMISION_RATE = new BigDecimal("0.10");
    private static final BigDecimal MULTA_RATE = new BigDecimal("0.10");

    /** Adjudica los ítems cuya ventana de puja venció y tienen ganador. */
    @Scheduled(fixedRateString = "${subastar.scheduler-ms:30000}", initialDelay = 10000)
    @Transactional
    public void adjudicarItemsVencidos() {
        LocalDateTime now = LocalDateTime.now();
        List<Pieza> vencidas = piezas.findByEstadoAndFinPujaBeforeAndMejorPostorIsNotNull(
                EstadoPieza.EN_SUBASTA, now);
        for (Pieza p : vencidas) {
            // Idempotencia: si ya tiene Venta, solo aseguramos el estado y seguimos.
            if (ventas.findByPiezaId(p.getId()).isPresent()) {
                p.setEstado(EstadoPieza.ADJUDICADO);
                continue;
            }
            Usuario ganador = p.getMejorPostor();
            Subasta s = p.getSubasta();
            BigDecimal precio = p.getMejorOferta();
            if (ganador == null || precio == null) continue;

            BigDecimal comision = precio.multiply(COMISION_RATE).setScale(2, RoundingMode.HALF_UP);

            Venta v = new Venta();
            v.setPieza(p);
            v.setComprador(ganador);
            v.setSubasta(s);
            v.setMedioPago(null); // lo elige el ganador al pagar
            v.setMontoOfertado(precio);
            v.setComision(comision);
            v.setTotalAPagar(precio.add(comision)); // sin envío aún (lo fija el /pay)
            v.setMoneda(s != null ? s.getMoneda() : null);
            v.setEstadoPago("PENDIENTE_PAGO");
            v.setFechaLimitePago(now.plusMinutes(plazoPagoMinutos));
            ventas.save(v);

            p.setEstado(EstadoPieza.ADJUDICADO); // sale de disponibilidad (managed → dirty check)

            crearNotif(ganador, TipoNotificacion.VENTA_GANADA, "¡Ganaste una subasta!",
                    "Adjudicaste «" + p.getDescripcion() + "». Tenés " + plazoPagoMinutos
                            + " min para pagar antes de que se aplique una multa.", v.getId());
            log.info("Adjudicada pieza {} a {} por {}", p.getId(), ganador.getId(), precio);
        }
    }

    /** Aplica multa a las ventas cuyo plazo de pago venció sin pago. */
    @Scheduled(fixedRateString = "${subastar.scheduler-ms:30000}", initialDelay = 15000)
    @Transactional
    public void aplicarMultasPorImpago() {
        LocalDateTime now = LocalDateTime.now();
        for (Venta v : ventas.findByEstadoPago("PENDIENTE_PAGO")) {
            if (v.getFechaLimitePago() == null || !now.isAfter(v.getFechaLimitePago())) continue;

            BigDecimal multa = v.getMontoOfertado().multiply(MULTA_RATE).setScale(2, RoundingMode.HALF_UP);
            v.setMulta(multa);
            v.setMultaPagada(false); // multa nueva: queda pendiente de regularizar
            v.setEstadoPago("INCUMPLIDO");

            Usuario u = v.getComprador();
            u.setTieneMulta(true);
            BigDecimal pendiente = u.getMontoPendienteMulta() != null
                    ? u.getMontoPendienteMulta() : BigDecimal.ZERO;
            u.setMontoPendienteMulta(pendiente.add(multa));
            usuarios.save(u);

            String bien = v.getPieza() != null ? v.getPieza().getDescripcion() : "un ítem";
            crearNotif(u, TipoNotificacion.MULTA_APLICADA, "Multa aplicada",
                    "Se aplicó una multa del 10% ($" + multa + ") por no pagar «" + bien
                            + "» a tiempo. Regularizá tu situación para volver a participar.", v.getId());
            log.info("Multa {} aplicada a {} por venta impaga {}", multa, u.getId(), v.getId());
        }
    }

    /**
     * Cierra las subastas EN_CURSO cuyos ítems ya finalizaron todos su ventana de
     * puja (estadoPuja CERRADO: vendidos/adjudicados o con finPuja vencido).
     * Resuelve el bug de "la subasta termina pero no pasa a CERRADA".
     */
    @Scheduled(fixedRateString = "${subastar.scheduler-ms:30000}", initialDelay = 20000)
    @Transactional
    public void cerrarSubastasCompletadas() {
        for (Subasta s : subastas.findByEstado(EstadoSubasta.EN_CURSO)) {
            List<Pieza> items = s.getCatalogo();
            if (items.isEmpty()) continue;
            boolean todosCerrados = items.stream()
                    .allMatch(p -> "CERRADO".equals(p.getEstadoPujaJson()));
            if (todosCerrados) {
                s.setEstado(EstadoSubasta.CERRADA); // managed → dirty check
                log.info("Subasta {} cerrada: todos sus ítems finalizaron la puja", s.getId());
            }
        }
    }

    private void crearNotif(Usuario u, TipoNotificacion tipo, String asunto, String cuerpo, String referenciaId) {
        notificaciones.save(Notificacion.builder()
                .usuario(u).tipo(tipo).asunto(asunto).cuerpo(cuerpo).referenciaId(referenciaId)
                .build());
    }
}
