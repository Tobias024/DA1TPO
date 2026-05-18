package com.subastapp.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.subastapp.model.enums.TipoNotificacion;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoNotificacion tipo;

    @JsonProperty("titulo")
    @Column(nullable = false)
    private String asunto;

    @JsonProperty("mensaje")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String cuerpo;

    @JsonProperty("leida")
    private boolean leido = false;

    @JsonProperty("fecha")
    private LocalDateTime fechaEnvio;

    // Referencia a la entidad relacionada (consignacionId / ventaId / subastaId / etc.)
    // Usado por el mobile para abrir la pantalla correcta al tocar la notificación.
    private String referenciaId;

    @PrePersist
    protected void onCreate() { this.fechaEnvio = LocalDateTime.now(); }
}
