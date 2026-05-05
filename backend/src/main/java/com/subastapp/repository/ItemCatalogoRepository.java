package com.subastapp.repository;

import com.subastapp.model.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, String> {
    List<ItemCatalogo> findByCatalogoId(String catalogoId);
}
