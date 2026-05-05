package com.subastapp.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Specialization of Pieza for artworks and designer objects.
 * Stores artist/designer info, creation date, and provenance history.
 */
@Entity
@Table(name = "obras_arte")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ObraArte extends Pieza {

    private String artista; // artist or designer name

    private String fechaObra; // can be a year range like "1967-1969"

    @Column(columnDefinition = "TEXT")
    private String historia; // provenance: previous owners, curiosities, context
}
