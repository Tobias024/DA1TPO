package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Ítem dentro de un catálogo (legacy: tabla `itemsCatalogo`).
 *
 * Une un Producto (= `Pieza`) con un Catálogo y le agrega los datos
 * específicos de la subasta: precio base y comisión que cobra la empresa.
 *
 * En la API móvil estos datos hoy van embebidos en `Pieza` por
 * conveniencia, pero la entidad existe para preservar la estructura legacy.
 */
@Entity
@Table(name = "items_catalogo") // legacy: itemsCatalogo
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ItemCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "catalogo_id", nullable = false)
    private Catalogo catalogo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Pieza producto;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal precioBase;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal comision;

    /** Legacy: 'si' / 'no' — true si la pieza ya pasó por la subasta. */
    @Builder.Default
    private boolean subastado = false;
}
