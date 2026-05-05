package com.subastapp.model;
public class UserProfile {
    private String id, nombre, apellido, email, domicilioLegal, paisOrigen, categoria, estado;
    private boolean tieneMulta;
    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public String getApellido() { return apellido; }
    public String getEmail() { return email; }
    public String getCategoria() { return categoria; }
    public String getEstado() { return estado; }
    public boolean isTieneMulta() { return tieneMulta; }
}
