package com.subastapp.model;

import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoUsuario;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

@Entity
@Table(name = "usuarios")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(nullable = false, unique = true)
    private String email;

    /** Documento de identidad — usado como credencial de login (PDF SubastAR). */
    @Column(unique = true)
    private String documento;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String domicilioLegal;

    @Column(nullable = false, length = 3)
    private String paisOrigen; // ISO 3166-1 alpha-3

    // Base64 stored paths/references to document photos
    private String fotoDniFrente;
    private String fotoDniDorso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaUsuario categoria = CategoriaUsuario.COMUN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoUsuario estado = EstadoUsuario.PENDIENTE_VERIFICACION;

    // Registration email token (step 2)
    private String registrationToken;
    private java.time.LocalDateTime registrationTokenExpiry;

    // Current active auction session (only 1 allowed at a time)
    private String subastaActivaId;

    // Penalty flag
    private boolean tieneMulta = false;
    private java.math.BigDecimal montoPendienteMulta;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MedioPago> mediosPago = new ArrayList<>();

    @OneToMany(mappedBy = "postor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Puja> pujas = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Notificacion> notificaciones = new ArrayList<>();

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = java.time.LocalDateTime.now();
    }

    // --- UserDetails implementation ---
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(); }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return estado != EstadoUsuario.SUSPENDIDO; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return estado == EstadoUsuario.APROBADO; }
}
