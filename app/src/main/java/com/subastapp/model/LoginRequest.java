package com.subastapp.model;

public class LoginRequest {
    private String documento;
    private String password;

    public LoginRequest(String documento, String password) {
        this.documento = documento;
        this.password = password;
    }

    public String getDocumento() { return documento; }
    public String getPassword() { return password; }
}
