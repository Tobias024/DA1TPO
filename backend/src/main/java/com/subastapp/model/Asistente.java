package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Inscripción de un cliente a una subasta concreta (legacy: tabla `asistentes`).
 *
 * Cada vez que el postor entra a una subasta vía `POST /auctions/{id}/join`
 * se crea o reusa un Asistente con un `numeroPostor` único dentro de esa
 * subasta. El `numeroPostor` se muestra al pujar (anonimato del postor).
 *
 * Las pujas (legacy `pujos`) referencian al Asistente, no directamente al
 * Usuario, para preservar el modelo de la empresa.
 */
@Entity
@Table(
    name = "asistentes",
    uniqueConstraints = @UniqueConstraint(columnNames = { "cliente_id", "subasta_id" })
)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Asistente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer numeroPostor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subasta_id", nullable = false)
    private Subasta subasta;
}
