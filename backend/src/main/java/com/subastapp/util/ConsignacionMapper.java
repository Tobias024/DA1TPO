package com.subastapp.util;

import com.subastapp.model.Consignacion;
import com.subastapp.model.Pieza;
import com.subastapp.model.PolizaSeguro;
import com.subastapp.model.Subasta;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Convierte una Consignacion (con asociaciones lazy) a un Map plano y estable para
 * la app. Debe invocarse dentro de una transacción / OSIV abierta para resolver las
 * lazy (subastaAsignada, pieza, pieza.polizaSeguro).
 *
 * Traduce los nombres de PolizaSeguro del backend (compania / montoAsegurado /
 * contactoCompania) a los que la app ya espera (aseguradora / valorAsegurado /
 * contactoAseguradora), eliminando el mismatch que dejaba la póliza en null.
 */
public final class ConsignacionMapper {

    private ConsignacionMapper() {}

    public static List<Map<String, Object>> toDtoList(List<Consignacion> cs) {
        return cs.stream().map(ConsignacionMapper::toDto).collect(Collectors.toList());
    }

    public static Map<String, Object> toDto(Consignacion c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("estado", c.getEstado() != null ? c.getEstado().name() : null);
        m.put("tipoBien", c.getTipoBien());
        m.put("descripcion", c.getDescripcion());
        m.put("categoria", c.getCategoria());
        m.put("artista", c.getArtista());
        m.put("historia", c.getHistoria());
        m.put("fotos", c.getFotos());
        m.put("declaraPropiedad", c.isDeclaraPropiedad());
        m.put("declaraOrigenLicito", c.isDeclaraOrigenLicito());
        m.put("precioBaseOfrecido", c.getPrecioBaseOfrecido());
        m.put("comision", c.getComision());
        m.put("causaRechazo", c.getCausaRechazo());
        m.put("motivoRechazo", c.getCausaRechazo()); // alias legacy de la app
        m.put("gastosDevolucion", c.getGastosDevolucion());
        m.put("fechaSolicitud", c.getFechaSolicitud());
        m.put("fechaSubastaAsignada", c.getFechaSubastaAsignada());
        m.put("envioConfirmado", c.isEnvioConfirmado());
        m.put("fechaEnvio", c.getFechaEnvio());

        // Subasta asignada (momento explícito en que la empresa la incluye en un catálogo).
        Subasta s = c.getSubastaAsignada();
        m.put("subastaAsignadaId", s != null ? s.getId() : null);
        m.put("subastaTitulo", s != null ? s.getTitulo() : null);
        m.put("subastaFecha", s != null ? s.getFechaHoraInicio() : null);

        // Depósito + póliza (viven en la Pieza creada al asignar).
        Pieza p = c.getPieza();
        m.put("ubicacionDeposito", p != null ? formatDeposito(p) : null);
        m.put("deposito", p != null ? depositoMap(p) : null);
        m.put("polizaSeguro", p != null ? polizaMap(p.getPolizaSeguro()) : null);
        return m;
    }

    private static String formatDeposito(Pieza p) {
        StringBuilder sb = new StringBuilder();
        if (p.getDepositoNombre() != null) sb.append(p.getDepositoNombre());
        if (p.getDepositoDireccion() != null) sb.append(sb.length() > 0 ? " — " : "").append(p.getDepositoDireccion());
        if (p.getDepositoSector() != null) sb.append(" (Sector ").append(p.getDepositoSector()).append(")");
        return sb.length() > 0 ? sb.toString() : null;
    }

    private static Map<String, Object> depositoMap(Pieza p) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("nombre", p.getDepositoNombre());
        d.put("direccion", p.getDepositoDireccion());
        d.put("sector", p.getDepositoSector());
        return d;
    }

    private static Map<String, Object> polizaMap(PolizaSeguro pol) {
        if (pol == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("aseguradora", pol.getCompania());
        m.put("numeroPoliza", pol.getNumeroPoliza());
        m.put("valorAsegurado", pol.getMontoAsegurado());
        m.put("contactoAseguradora", pol.getContactoCompania());
        m.put("moneda", pol.getMoneda());
        m.put("vigenciaDesde", pol.getVigenciaDesde());
        m.put("vigenciaHasta", pol.getVigenciaHasta());
        return m;
    }
}
