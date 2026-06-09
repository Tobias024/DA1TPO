package com.subastapp.util;

import com.subastapp.model.MedioPago;
import com.subastapp.model.enums.TipoMedioPago;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Convierte MedioPago a un Map plano para la app, con los datos sensibles
 * ENMASCARADOS (nunca se expone el número completo de tarjeta ni el CVV;
 * el backend tampoco los almacena).
 */
public final class MedioPagoMapper {

    private MedioPagoMapper() {}

    public static List<Map<String, Object>> toDtoList(List<MedioPago> medios) {
        return medios.stream().map(MedioPagoMapper::toDto).collect(Collectors.toList());
    }

    public static Map<String, Object> toDto(MedioPago mp) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", mp.getId());
        m.put("tipo", mp.getTipo());
        m.put("moneda", mp.getMoneda());
        m.put("verificado", mp.isVerificado());
        m.put("proveedor", proveedor(mp));
        m.put("ultimosDigitos", mp.getUltimosDigitosTarjeta());

        if (mp.getTipo() == TipoMedioPago.TARJETA_CREDITO) {
            m.put("titular", mp.getTitularTarjeta());
            m.put("numeroMasked", mp.getUltimosDigitosTarjeta() != null
                    ? "•••• •••• •••• " + mp.getUltimosDigitosTarjeta() : null);
            m.put("vencimiento", mp.getVencimientoTarjeta());
            m.put("codigoMasked", "•••");
            m.put("internacional", mp.isEsInternacional());
        } else if (mp.getTipo() == TipoMedioPago.CUENTA_BANCARIA) {
            m.put("banco", mp.getBanco());
            m.put("numeroCuentaMasked", maskTail(mp.getNumeroCuenta()));
            m.put("cbuMasked", maskTail(mp.getCbu()));
        } else if (mp.getTipo() == TipoMedioPago.CHEQUE_CERTIFICADO) {
            m.put("banco", mp.getBanco());
            m.put("numeroCheque", mp.getNumeroCheque());
            m.put("montoGarantia", mp.getMontoCheque());
            m.put("montoDisponible", mp.getMontoDisponibleCheque());
        }
        return m;
    }

    private static String proveedor(MedioPago mp) {
        if (mp.getBanco() != null) return mp.getBanco();
        if (mp.getTipo() == TipoMedioPago.TARJETA_CREDITO) return "Tarjeta de crédito";
        return mp.getTipo() != null ? mp.getTipo().name() : null;
    }

    private static String maskTail(String value) {
        if (value == null || value.isBlank()) return null;
        String tail = value.length() >= 4 ? value.substring(value.length() - 4) : value;
        return "•••• " + tail;
    }
}
