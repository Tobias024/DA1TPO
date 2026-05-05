package com.subastapp.model;

import java.util.List;

public class Piece {
    private String id;
    private int numeroItem;
    private String descripcion;
    private double precioBase;
    private String estado;
    private List<String> imagenes;
    private boolean esObraArte;
    private String artista;
    private String fechaObra;
    private String historia;
    private double mejorOferta;

    public String getId() { return id; }
    public int getNumeroItem() { return numeroItem; }
    public String getDescripcion() { return descripcion; }
    public double getPrecioBase() { return precioBase; }
    public String getEstado() { return estado; }
    public List<String> getImagenes() { return imagenes; }
    public boolean isEsObraArte() { return esObraArte; }
    public String getArtista() { return artista; }
    public String getFechaObra() { return fechaObra; }
    public String getHistoria() { return historia; }
    public double getMejorOferta() { return mejorOferta; }

    /** Minimum next bid = mejorOferta + 1% of precioBase */
    public double getLimiteMinimo() {
        double base = mejorOferta > 0 ? mejorOferta : precioBase;
        return base + precioBase * 0.01;
    }

    /** Maximum next bid = mejorOferta + 20% of precioBase */
    public double getLimiteMaximo() {
        double base = mejorOferta > 0 ? mejorOferta : precioBase;
        return base + precioBase * 0.20;
    }
}
