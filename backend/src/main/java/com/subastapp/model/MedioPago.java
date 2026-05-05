package com.subastapp.model;

import com.subastapp.model.enums.Moneda;
import com.subastapp.model.enums.TipoMedioPago;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "medios_pago")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class MedioPago {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMedioPago tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Moneda moneda;

    /**
     * Verificación a cargo de la empresa subastadora (sistema externo, fuera de
     * scope de esta entrega). En la app móvil se asume verificado por default
     * — el lado servidor podrá invalidarlo cuando exista la integración.
     */
    private boolean verificado = true;

    // CUENTA_BANCARIA fields
    private String banco;
    private String numeroCuenta;
    private String cbu;
    private String swift; // for foreign banks

    // TARJETA_CREDITO fields
    private String ultimosDigitosTarjeta;
    private String titularTarjeta;
    private String vencimientoTarjeta;
    private boolean esInternacional;

    // CHEQUE_CERTIFICADO fields
    @Column(precision = 19, scale = 2)
    private BigDecimal montoCheque;
    @Column(precision = 19, scale = 2)
    private BigDecimal montoUsado;
    private String numeroCheque;

    public BigDecimal getMontoDisponibleCheque() {
        if (montoCheque == null) return BigDecimal.ZERO;
        BigDecimal usado = montoUsado != null ? montoUsado : BigDecimal.ZERO;
        return montoCheque.subtract(usado);
    }
}
