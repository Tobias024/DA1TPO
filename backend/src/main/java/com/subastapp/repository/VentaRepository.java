package com.subastapp.repository;

import com.subastapp.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, String> {
    List<Venta> findByCompradorIdOrderByFechaVentaDesc(String compradorId);
}
