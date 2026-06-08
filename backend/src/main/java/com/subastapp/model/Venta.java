package com.subastapp.model;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "registroDeSubasta") // nombre legacy (EstructuraActual.sql)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pieza_id", nullable = false, unique = true)
    private Pieza pieza;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comprador_id", nullable = false)
    private Usuario comprador;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta_id", nullable = false)
    private Subasta subasta;

    // nullable: la Venta nace en la adjudicación (scheduler) SIN medio de pago;
    // el ganador lo elige al pagar (/sales/won/{id}/pay).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medio_pago_id", nullable = true)
    private MedioPago medioPago;

    @JsonProperty("precio")
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montoOfertado;

    @JsonProperty("comisiones")
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

    // Fecha límite para pagar tras la adjudicación; vencida sin pago -> multa.
    private LocalDateTime fechaLimitePago;

    // Shipping address
    private String direccionEnvio;
    @lombok.Builder.Default
    private boolean retiraPersonalmente = false;

    // Penalty amount if applicable
    @Column(precision = 19, scale = 2)
    private BigDecimal multa;

    @JsonProperty("fecha")
    private LocalDateTime fechaVenta;

    @PrePersist
    protected void onCreate() { this.fechaVenta = LocalDateTime.now(); }

    // Campos derivados que el mobile consume directamente desde el JSON.
    @JsonGetter("nombreBien")
    public String getNombreBienJson() {
        return pieza != null ? pieza.getDescripcion() : null;
    }

    @JsonGetter("subastaId")
    public String getSubastaIdJson() {
        return subasta != null ? subasta.getId() : null;
    }

    @JsonGetter("piezaId")
    public String getPiezaIdJson() {
        return pieza != null ? pieza.getId() : null;
    }
}
