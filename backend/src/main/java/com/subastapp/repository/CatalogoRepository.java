package com.subastapp.repository;

import com.subastapp.model.Catalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CatalogoRepository extends JpaRepository<Catalogo, String> {
    Optional<Catalogo> findBySubastaId(String subastaId);
}
