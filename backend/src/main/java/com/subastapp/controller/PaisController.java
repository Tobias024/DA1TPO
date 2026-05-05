package com.subastapp.controller;

import com.subastapp.model.Pais;
import com.subastapp.repository.PaisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catálogo público de países (legacy: tabla `paises`).
 * Endpoint usado por la pantalla de Registro.
 */
@RestController
@RequestMapping("/api/v1/paises")
@RequiredArgsConstructor
public class PaisController {

    private final PaisRepository paises;

    @GetMapping("/todos")
    public ResponseEntity<List<Pais>> listar() {
        return ResponseEntity.ok(paises.findAll());
    }
}
