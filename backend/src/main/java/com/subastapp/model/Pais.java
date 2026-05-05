package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Catálogo de países (legacy: tabla `paises`).
 *
 * Usado en el flujo de registro: el postor selecciona su país de origen
 * (PDF "datos del postor → país de origen").
 */
@Entity
@Table(name = "paises")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Pais {

    @Id
    private Integer numero; // legacy: numeric ISO-like code

    @Column(nullable = false)
    private String nombre;

    private String nombreCorto;

    @Column(nullable = false)
    private String capital;

    @Column(nullable = false)
    private String nacionalidad;

    @Column(nullable = false)
    private String idiomas;
}
