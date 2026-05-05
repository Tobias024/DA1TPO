package com.subastapp.model;

public class MedioPago {
    private String id;
    private String tipo;
    private String moneda;
    private boolean verificado;
    private String banco;
    private String ultimosDigitosTarjeta;
    private String titularTarjeta;
    private String vencimientoTarjeta;
    private double montoCheque;
    private double montoUsado;
    private double montoDisponible;

    public String getId() { return id; }
    public String getTipo() { return tipo; }
    public String getMoneda() { return moneda; }
    public boolean isVerificado() { return verificado; }
    public String getBanco() { return banco; }
    public String getUltimosDigitosTarjeta() { return ultimosDigitosTarjeta; }
    public String getTitularTarjeta() { return titularTarjeta; }
    public String getVencimientoTarjeta() { return vencimientoTarjeta; }
    public double getMontoCheque() { return montoCheque; }
    public double getMontoDisponible() { return montoDisponible; }
}
