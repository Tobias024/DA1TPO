package com.subastapp.model;

import com.subastapp.model.enums.EstadoConsignacion;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consignaciones")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Consignacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private String tipoBien;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    private String categoria; // ARTE, JOYA, INMUEBLE, VEHICULO, OTRO

    private String fechaAdquisicion;

    // Optional art/designer fields
    private String artista;

    @Column(columnDefinition = "TEXT")
    private String historia;

    // Legal declarations
    @Column(nullable = false)
    private boolean declaraPropiedad = false;

    @Column(nullable = false)
    private boolean declaraOrigenLicito = false;

    @ElementCollection
    @CollectionTable(name = "consignacion_fotos", joinColumns = @JoinColumn(name = "consignacion_id"))
    @Column(name = "foto_url")
    @Builder.Default
    private List<String> fotos = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoConsignacion estado = EstadoConsignacion.PENDIENTE;

    // When accepted: proposed price and commission
    @Column(precision = 19, scale = 2)
    private BigDecimal precioBaseOfrecido;

    @Column(precision = 5, scale = 4)
    private BigDecimal comision; // e.g. 0.15 = 15%

    // When rejected
    @Column(columnDefinition = "TEXT")
    private String causaRechazo;

    @Column(precision = 19, scale = 2)
    private BigDecimal gastosDevolucion;

    // When assigned to auction
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta_id")
    private Subasta subastaAsignada;

    // Created piece after acceptance
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "pieza_id")
    private Pieza pieza;

    private LocalDateTime fechaSolicitud;

    @PrePersist
    protected void onCreate() { this.fechaSolicitud = LocalDateTime.now(); }
}
