package com.subastapp.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra el módulo Hibernate6 en Jackson. Sin esto, serializar una entidad JPA
 * con una asociación LAZY no inicializada explota con
 * "No serializer found for ByteBuddyInterceptor". Con el módulo, las asociaciones
 * lazy no inicializadas se serializan como null (no se fuerza su carga).
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        return new Hibernate6Module();
    }
}
