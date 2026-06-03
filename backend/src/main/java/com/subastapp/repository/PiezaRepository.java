package com.subastapp.repository;

import com.subastapp.model.Pieza;
import com.subastapp.model.enums.EstadoSubasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PiezaRepository extends JpaRepository<Pieza, String> {
    List<Pieza> findByMejorPostorIdAndSubastaEstado(String mejorPostorId, EstadoSubasta estado);
}
