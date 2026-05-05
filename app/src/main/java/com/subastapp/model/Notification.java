package com.subastapp.model;
public class Notification {
    private String id, tipo, asunto, cuerpo, fechaEnvio;
    private boolean leido;
    public String getId() { return id; }
    public String getTipo() { return tipo; }
    public String getAsunto() { return asunto; }
    public String getCuerpo() { return cuerpo; }
    public String getFechaEnvio() { return fechaEnvio; }
    public boolean isLeido() { return leido; }
}
