package com.subastapp.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Auction {
    private String id;
    private String titulo;
    private String descripcion;
    private String fechaHoraInicio;
    private String ubicacion;
    private String categoriaRequerida;
    private String moneda;
    private String estado;
    private boolean enVivo;
    private String streamingUrl;
    private Rematador rematador;
    private Piece itemActual;
    private boolean usuarioPuedeParticipar;
    private boolean usuarioPuedePujar;
    private String motivoNoPuede;

    public String getId() { return id; }
    public String getTitulo() { return titulo; }
    public String getDescripcion() { return descripcion; }
    public String getFechaHoraInicio() { return fechaHoraInicio; }
    public String getUbicacion() { return ubicacion; }
    public String getCategoriaRequerida() { return categoriaRequerida; }
    public String getMoneda() { return moneda; }
    public String getEstado() { return estado; }
    public boolean isEnVivo() { return enVivo; }
    public String getStreamingUrl() { return streamingUrl; }
    public Rematador getRematador() { return rematador; }
    public Piece getItemActual() { return itemActual; }
    public boolean isUsuarioPuedeParticipar() { return usuarioPuedeParticipar; }
    public boolean isUsuarioPuedePujar() { return usuarioPuedePujar; }
    public String getMotivoNoPuede() { return motivoNoPuede; }

    public static class Rematador {
        private String id;
        private String nombre;
        public String getNombre() { return nombre; }
    }
}
