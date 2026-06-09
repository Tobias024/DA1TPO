package com.subastapp.repository;

import com.subastapp.model.Subasta;
import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoSubasta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubastaRepository extends JpaRepository<Subasta, String> {
    Page<Subasta> findByEstado(EstadoSubasta estado, Pageable pageable);
    List<Subasta> findByEstado(EstadoSubasta estado);
    Page<Subasta> findByCategoriaRequeridaIn(List<CategoriaUsuario> categorias, Pageable pageable);
    Page<Subasta> findByEstadoAndCategoriaRequeridaIn(EstadoSubasta estado, List<CategoriaUsuario> categorias, Pageable pageable);
}
