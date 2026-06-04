package com.subastapp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.subastapp.model.enums.EstadoPieza;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "productos") // nombre legacy (EstructuraActual.sql — fusión de productos + itemsCatalogo)
@Inheritance(strategy = InheritanceType.JOINED)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Pieza {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer numeroItem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal precioBase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoPieza estado = EstadoPieza.EN_DEPOSITO;

    // Images stored as comma-separated URLs or JSON array.
    // EAGER: el catálogo/carrusel siempre necesita las imágenes al serializar la pieza.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pieza_imagenes", joinColumns = @JoinColumn(name = "pieza_id"))
    @Column(name = "imagen_url")
    @Builder.Default
    private List<String> imagenes = new ArrayList<>();

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dueno_id")
    private Usuario dueno;

    // @JsonIgnore: corta la recursión Pieza -> Subasta -> catalogo -> Pieza al
    // serializar el catálogo. El front ya conoce la subasta por contexto.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta_id")
    private Subasta subasta;

    // Location in warehouse
    private String depositoNombre;
    private String depositoDireccion;
    private String depositoSector;

    // The current highest bid for this item (cached for performance)
    @Column(precision = 19, scale = 2)
    private BigDecimal mejorOferta;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mejor_postor_id")
    private Usuario mejorPostor;

    @OneToOne(mappedBy = "pieza", cascade = CascadeType.ALL)
    private PolizaSeguro polizaSeguro;

    /**
     * Minimum next bid = current best offer + 1% of base price
     */
    public BigDecimal calcularLimiteMinimoPuja() {
        BigDecimal base = mejorOferta != null ? mejorOferta : precioBase;
        return base.add(precioBase.multiply(new java.math.BigDecimal("0.01")));
    }

    /**
     * Maximum next bid = current best offer + 20% of base price
     */
    public BigDecimal calcularLimiteMaximoPuja() {
        BigDecimal base = mejorOferta != null ? mejorOferta : precioBase;
        return base.add(precioBase.multiply(new java.math.BigDecimal("0.20")));
    }
}
