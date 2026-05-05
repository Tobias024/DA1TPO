package com.subastapp.model;

public class Consignment {
    private String id;
    private String tipoBien;
    private String descripcion;
    private String estado;
    private String fechaSolicitud;
    private String causaRechazo;
    private double precioBaseOfrecido;
    private double comision;

    public String getId() { return id; }
    public String getTipoBien() { return tipoBien; }
    public String getDescripcion() { return descripcion; }
    public String getEstado() { return estado; }
    public String getFechaSolicitud() { return fechaSolicitud; }
    public String getCausaRechazo() { return causaRechazo; }
    public double getPrecioBaseOfrecido() { return precioBaseOfrecido; }
    public double getComision() { return comision; }
}
