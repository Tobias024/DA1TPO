package com.subastapp.model;
public class Sale {
    private String id, estadoPago, moneda, fechaVenta;
    private double montoOfertado, comision, costoEnvio, totalAPagar;
    private Piece pieza;
    public String getId() { return id; }
    public String getEstadoPago() { return estadoPago; }
    public double getTotalAPagar() { return totalAPagar; }
    public Piece getPieza() { return pieza; }
    public String getFechaVenta() { return fechaVenta; }
    public String getMoneda() { return moneda; }
}
