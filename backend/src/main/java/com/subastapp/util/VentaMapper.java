package com.subastapp.util;

import com.subastapp.model.MedioPago;
import com.subastapp.model.Venta;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Convierte una Venta (entidad JPA con asociaciones lazy) a un Map plano y estable
 * para la app móvil. Debe invocarse dentro de una transacción / OSIV abierta para
 * que las asociaciones lazy se resuelvan.
 */
public final class VentaMapper {

    private VentaMapper() {}

    public static Map<String, Object> toDto(Venta v) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("nombreBien", v.getPieza() != null ? v.getPieza().getDescripcion() : null);
        m.put("piezaId", v.getPieza() != null ? v.getPieza().getId() : null);
        m.put("subastaId", v.getSubasta() != null ? v.getSubasta().getId() : null);
        m.put("precio", v.getMontoOfertado());
        m.put("comisiones", v.getComision());
        m.put("costoEnvio", v.getCostoEnvio());
        m.put("total", v.getTotalAPagar());
        m.put("moneda", v.getMoneda());
        m.put("estadoPago", v.getEstadoPago());
        m.put("fechaLimitePago", v.getFechaLimitePago());
        m.put("retiraPersonalmente", v.isRetiraPersonalmente());
        m.put("direccionEnvio", v.getDireccionEnvio());
        m.put("fecha", v.getFechaVenta());
        m.put("medioPago", medioPagoResumen(v.getMedioPago()));
        return m;
    }

    public static List<Map<String, Object>> toDtoList(List<Venta> ventas) {
        return ventas.stream().map(VentaMapper::toDto).collect(Collectors.toList());
    }

    /** Resumen liviano del medio de pago para mostrar en la compra. */
    public static Map<String, Object> medioPagoResumen(MedioPago mp) {
        if (mp == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", mp.getId());
        m.put("tipo", mp.getTipo());
        m.put("proveedor", proveedor(mp));
        m.put("ultimosDigitos", mp.getUltimosDigitosTarjeta());
        return m;
    }

    private static String proveedor(MedioPago mp) {
        if (mp.getBanco() != null) return mp.getBanco();
        if (mp.getTitularTarjeta() != null) return mp.getTitularTarjeta();
        if (mp.getNumeroCheque() != null) return "Cheque " + mp.getNumeroCheque();
        return mp.getTipo() != null ? mp.getTipo().name() : null;
    }
}
