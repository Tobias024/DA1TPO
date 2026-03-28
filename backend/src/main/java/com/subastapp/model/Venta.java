package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ventas")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pieza_id", nullable = false)
    private Pieza pieza;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comprador_id", nullable = false)
    private Usuario comprador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta_id", nullable = false)
    private Subasta subasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medio_pago_id", nullable = false)
    private MedioPago medioPago;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montoOfertado;

    @Column(precision = 19, scale = 2)
    private BigDecimal comision;

    @Column(precision = 19, scale = 2)
    private BigDecimal costoEnvio;

    @Column(precision = 19, scale = 2)
    private BigDecimal totalAPagar;

    @Enumerated(EnumType.STRING)
    private com.subastapp.model.enums.Moneda moneda;

    @Column(nullable = false)
    private String estadoPago; // PENDIENTE_PAGO, PAGADO, INCUMPLIDO, EN_JUSTICIA

    // Shipping address
    private String direccionEnvio;
    private boolean retiraPersonalmente = false;

    // Penalty amount if applicable
    @Column(precision = 19, scale = 2)
    private BigDecimal multa;

    private LocalDateTime fechaVenta;

    @PrePersist
    protected void onCreate() { this.fechaVenta = LocalDateTime.now(); }
}
