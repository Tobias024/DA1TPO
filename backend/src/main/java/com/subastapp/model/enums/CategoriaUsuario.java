package com.subastapp.model.enums;

public enum CategoriaUsuario {
    COMUN, ESPECIAL, PLATA, ORO, PLATINO;

    /**
     * Returns true if this category is >= the required category for the auction.
     */
    public boolean puedeAcceder(CategoriaUsuario categoriaSubasta) {
        return this.ordinal() >= categoriaSubasta.ordinal();
    }
}
