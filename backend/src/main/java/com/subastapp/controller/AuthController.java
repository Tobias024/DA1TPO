package com.subastapp.controller;

import com.subastapp.model.Usuario;
import com.subastapp.model.enums.EstadoUsuario;
import com.subastapp.repository.UsuarioRepository;
import com.subastapp.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    /** STEP 1: Datos personales + foto DNI (PDF SubastAR — etapa 1). */
    @PostMapping("/register/step1")
    public ResponseEntity<?> registerStep1(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String documento = body.get("documento");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email es requerido"));
        }
        if (documento == null || documento.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Documento es requerido"));
        }
        if (usuarioRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El email ya está registrado"));
        }
        if (usuarioRepository.existsByDocumento(documento)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El documento ya está registrado"));
        }

        Usuario usuario = Usuario.builder()
                .nombre(body.get("nombre"))
                .apellido(body.get("apellido"))
                .email(email)
                .documento(documento)
                .password("PENDING") // not set yet
                .domicilioLegal(body.get("domicilioLegal"))
                .paisOrigen(body.get("paisOrigen"))
                .fotoDniFrente(body.get("fotoDniFrente"))
                .fotoDniDorso(body.get("fotoDniDorso"))
                .estado(EstadoUsuario.PENDIENTE_VERIFICACION)
                .build();

        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Registro iniciado. Recibirá un email cuando su cuenta sea aprobada.",
                        "registrationId", usuario.getId()
                ));
    }

    /** STEP 2: Set password after email approval (uses registration token) */
    @PostMapping("/register/step2")
    public ResponseEntity<?> registerStep2(@RequestBody Map<String, String> body) {
        String token = body.get("registrationToken");
        String password = body.get("password");
        String confirm = body.get("passwordConfirm");

        if (token == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token y contraseña son requeridos"));
        }
        if (!password.equals(confirm)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Las contraseñas no coinciden"));
        }

        return usuarioRepository.findByRegistrationToken(token)
                .map(usuario -> {
                    if (usuario.getRegistrationTokenExpiry().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.status(HttpStatus.GONE)
                                .body(Map.of("error", "El token ha expirado"));
                    }
                    usuario.setPassword(passwordEncoder.encode(password));
                    usuario.setEstado(EstadoUsuario.APROBADO);
                    usuario.setRegistrationToken(null);
                    usuarioRepository.save(usuario);

                    return ResponseEntity.ok(Map.of(
                            "accessToken", jwtUtil.generateToken(usuario.getEmail()),
                            "refreshToken", jwtUtil.generateRefreshToken(usuario.getEmail()),
                            "user", Map.of(
                                    "id", usuario.getId(),
                                    "nombre", usuario.getNombre(),
                                    "categoria", usuario.getCategoria()
                            )
                    ));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "Token inválido")));
    }

    /** LOGIN — autenticación por documento + contraseña (PDF SubastAR). */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String documento = body.get("documento");
        String password = body.get("password");

        if (documento == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Documento y contraseña son requeridos"));
        }

        Usuario usuario = usuarioRepository.findByDocumento(documento).orElse(null);
        if (usuario == null || !passwordEncoder.matches(password, usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales incorrectas"));
        }
        if (usuario.getEstado() == EstadoUsuario.SUSPENDIDO) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Usuario suspendido. Regularice su situación para continuar."));
        }
        if (usuario.getEstado() != EstadoUsuario.APROBADO) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cuenta pendiente de aprobación."));
        }

        return ResponseEntity.ok(Map.of(
                "accessToken", jwtUtil.generateToken(usuario.getEmail()),
                "refreshToken", jwtUtil.generateRefreshToken(usuario.getEmail()),
                "user", Map.of(
                        "id", usuario.getId(),
                        "nombre", usuario.getNombre(),
                        "apellido", usuario.getApellido(),
                        "email", usuario.getEmail(),
                        "documento", usuario.getDocumento() != null ? usuario.getDocumento() : "",
                        "categoria", usuario.getCategoria(),
                        "estado", usuario.getEstado()
                )
        ));
    }

    /** REFRESH TOKEN */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || !jwtUtil.isTokenValid(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Refresh token inválido o expirado"));
        }
        String email = jwtUtil.extractEmail(refreshToken);
        return ResponseEntity.ok(Map.of("accessToken", jwtUtil.generateToken(email)));
    }
}
