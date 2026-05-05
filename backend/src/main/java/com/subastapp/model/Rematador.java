package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subastadores") // nombre legacy (EstructuraActual.sql)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Rematador {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String matricula;

    private String email;
    private String telefono;
}
