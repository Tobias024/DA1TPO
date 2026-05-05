package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Catálogo de una subasta (legacy: tabla `catalogos`).
 *
 * Cada subasta tiene un único catálogo asociado, que agrupa los ítems a
 * subastar. En la implementación actual la `Subasta` ya expone su catálogo
 * vía `subasta.getCatalogo()` (lista de Pieza), pero se modela el Catalogo
 * para preservar la estructura legacy 1:1 con la tabla `catalogos`.
 */
@Entity
@Table(name = "catalogos")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Catalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String descripcion;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta_id")
    private Subasta subasta;

    /**
     * Empleado responsable del catálogo (legacy `responsable INT NOT NULL`).
     * En la app móvil no se expone — placeholder para compatibilidad.
     */
    private String responsableId;

    @OneToMany(mappedBy = "catalogo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItemCatalogo> items = new ArrayList<>();
}
