package com.subastapp.repository;

import com.subastapp.model.Puja;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PujaRepository extends JpaRepository<Puja, String> {
    List<Puja> findBySubastaIdAndPiezaIdOrderByTimestampAsc(String subastaId, String piezaId);
    Page<Puja> findBySubastaIdOrderByTimestampAsc(String subastaId, Pageable pageable);
    Optional<Puja> findTopByPiezaIdOrderByTimestampDesc(String piezaId);
    long countByPostorIdAndConfirmadaFalse(String postorId);
}
