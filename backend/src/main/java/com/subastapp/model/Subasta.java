package com.subastapp.model;

import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoSubasta;
import com.subastapp.model.enums.Moneda;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subastas")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Subasta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(nullable = false)
    private String ubicacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaUsuario categoriaRequerida;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Moneda moneda;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoSubasta estado = EstadoSubasta.PROXIMA;

    private String streamingUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rematador_id")
    private Rematador rematador;

    @OneToMany(mappedBy = "subasta", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("numeroItem ASC")
    @Builder.Default
    private List<Pieza> catalogo = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_actual_id")
    private Pieza itemActual;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}
