package com.subastapp.model;

import com.google.gson.annotations.SerializedName;

public class LoginResponse {
    @SerializedName("accessToken")
    private String accessToken;
    @SerializedName("refreshToken")
    private String refreshToken;
    @SerializedName("user")
    private UserSummary user;

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public UserSummary getUser() { return user; }

    public static class UserSummary {
        private String id;
        private String nombre;
        private String apellido;
        private String email;
        private String categoria;
        private String estado;

        public String getId() { return id; }
        public String getNombre() { return nombre; }
        public String getApellido() { return apellido; }
        public String getEmail() { return email; }
        public String getCategoria() { return categoria; }
        public String getEstado() { return estado; }
    }
}
