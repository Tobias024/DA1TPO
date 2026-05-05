package com.subastapp.repository;

import com.subastapp.model.MedioPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedioPagoRepository extends JpaRepository<MedioPago, String> {
    List<MedioPago> findByUsuarioId(String usuarioId);
    boolean existsByUsuarioIdAndVerificadoTrue(String usuarioId);
}
