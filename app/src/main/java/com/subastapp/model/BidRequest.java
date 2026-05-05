package com.subastapp.model;

public class BidRequest {
    private String itemId;
    private double monto;
    private String medioPagoId;

    public BidRequest(String itemId, double monto, String medioPagoId) {
        this.itemId = itemId;
        this.monto = monto;
        this.medioPagoId = medioPagoId;
    }
}
