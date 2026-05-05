package com.subastapp.repository;

import com.subastapp.model.Consignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsignacionRepository extends JpaRepository<Consignacion, String> {
    List<Consignacion> findByUsuarioIdOrderByFechaSolicitudDesc(String usuarioId);
}
