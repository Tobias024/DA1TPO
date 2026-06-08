package com.subastapp.repository;

import com.subastapp.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, String> {
    List<Venta> findByCompradorIdOrderByFechaVentaDesc(String compradorId);
    Optional<Venta> findByPiezaId(String piezaId);

    /** Ventas del usuario en los estados dados (para "Mis compras / ganadas"). */
    List<Venta> findByCompradorIdAndEstadoPagoInOrderByFechaVentaDesc(String compradorId, Collection<String> estados);

    /** Ventas en un estado dado (el scheduler busca las PENDIENTE_PAGO para multar). */
    List<Venta> findByEstadoPago(String estadoPago);
}
