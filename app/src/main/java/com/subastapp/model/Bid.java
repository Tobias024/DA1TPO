package com.subastapp.model;

public class Bid {
    private String id;
    private double monto;
    private String timestamp;
    private PostorAlias postor;
    private boolean esMejorOferta;

    public String getId() { return id; }
    public double getMonto() { return monto; }
    public String getTimestamp() { return timestamp; }
    public PostorAlias getPostor() { return postor; }
    public boolean isEsMejorOferta() { return esMejorOferta; }

    public static class PostorAlias {
        private String id;
        private String alias;
        public String getAlias() { return alias; }
    }
}
