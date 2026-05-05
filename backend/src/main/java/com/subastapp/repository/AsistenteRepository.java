package com.subastapp.repository;

import com.subastapp.model.Asistente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AsistenteRepository extends JpaRepository<Asistente, String> {
    Optional<Asistente> findByClienteIdAndSubastaId(String clienteId, String subastaId);
    long countBySubastaId(String subastaId);
}
