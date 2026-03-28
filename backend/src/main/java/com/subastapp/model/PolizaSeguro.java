package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "polizas_seguro")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class PolizaSeguro {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pieza_id")
    private Pieza pieza;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiario_id")
    private Usuario beneficiario;

    @Column(nullable = false)
    private String numeroPoliza;

    @Column(nullable = false)
    private String compania;

    private String contactoCompania;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montoAsegurado;

    @Enumerated(EnumType.STRING)
    private com.subastapp.model.enums.Moneda moneda;

    private LocalDateTime vigenciaDesde;
    private LocalDateTime vigenciaHasta;
}
