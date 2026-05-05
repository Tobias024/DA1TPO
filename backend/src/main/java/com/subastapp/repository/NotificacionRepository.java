package com.subastapp.repository;

import com.subastapp.model.Notificacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, String> {
    Page<Notificacion> findByUsuarioIdOrderByFechaEnvioDesc(String usuarioId, Pageable pageable);
    Page<Notificacion> findByUsuarioIdAndLeidoOrderByFechaEnvioDesc(String usuarioId, boolean leido, Pageable pageable);
    long countByUsuarioIdAndLeidoFalse(String usuarioId);
}
