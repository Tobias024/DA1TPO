package com.subastapp.config;

import com.subastapp.model.Consignacion;
import com.subastapp.model.MedioPago;
import com.subastapp.model.Pais;
import com.subastapp.model.Pieza;
import com.subastapp.model.Subasta;
import com.subastapp.model.Usuario;
import com.subastapp.model.enums.CategoriaUsuario;
import com.subastapp.model.enums.EstadoConsignacion;
import com.subastapp.model.enums.EstadoPieza;
import com.subastapp.model.enums.EstadoSubasta;
import com.subastapp.model.enums.EstadoUsuario;
import com.subastapp.model.enums.Moneda;
import com.subastapp.model.enums.TipoMedioPago;
import com.subastapp.repository.ConsignacionRepository;
import com.subastapp.repository.MedioPagoRepository;
import com.subastapp.repository.PaisRepository;
import com.subastapp.repository.SubastaRepository;
import com.subastapp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Carga datos de prueba al arrancar con perfil `dev`.
 *
 *   Documento: 11111111
 *   Password:  test1234
 *   Categoría: ORO (acceso a subastas COMUN/ESPECIAL/PLATA/ORO + sin tope de puja)
 *
 * Para regenerar desde cero borrá `backend/data/` y reiniciá.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarios;
    private final MedioPagoRepository mediosPago;
    private final SubastaRepository subastas;
    private final PaisRepository paises;
    private final ConsignacionRepository consignaciones;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedPaises();

        if (usuarios.existsByDocumento("11111111")) {
            log.info("Seed dev: usuario de prueba ya existe, salteando.");
            return;
        }

        // ── Usuario de prueba ────────────────────────────────────────
        Usuario u = Usuario.builder()
                .nombre("Tobias")
                .apellido("Demo")
                .email("test@subastar.ar")
                .documento("11111111")
                .password(passwordEncoder.encode("test1234"))
                .domicilioLegal("Av. Siempre Viva 742")
                .paisOrigen("ARG")
                .categoria(CategoriaUsuario.ORO)
                .estado(EstadoUsuario.APROBADO)
                .build();
        usuarios.save(u);

        // ── Medio de pago verificado (necesario para pujar) ──────────
        MedioPago mp = MedioPago.builder()
                .usuario(u)
                .tipo(TipoMedioPago.TARJETA_CREDITO)
                .moneda(Moneda.ARS)
                .verificado(true)
                .ultimosDigitosTarjeta("4242")
                .titularTarjeta("TOBIAS DEMO")
                .vencimientoTarjeta("12/30")
                .esInternacional(false)
                .build();
        mediosPago.save(mp);

        // ── Subastas de muestra ──────────────────────────────────────
        // Imágenes: picsum.photos con seeds estables (siempre devuelve la
        // misma imagen para cada seed). Para reemplazar por URLs propias
        // o de Wikimedia Commons, editá las constantes IMG_*.
        seedArteLatinoamericano(u);
        seedRelojeria();
        seedAutosClasicos();
        seedJoyasOro();
        seedAntiguedadesProgramada();
        seedColeccionPlatino();
        seedFinalizadaVendida();

        // ── Consignaciones del usuario en distintos estados ──────────
        // Para que "Mis Subastas" muestre los 5 casos del flujo PDF sin
        // necesidad de pegarle a /admin antes.
        seedConsignaciones(u);

        log.info("══════════════════════════════════════════════════");
        log.info(" Seed dev cargado:");
        log.info("   • 1 usuario de prueba");
        log.info("   • 1 medio de pago verificado");
        log.info("   • {} subastas con catálogo", subastas.count());
        log.info("   • {} consignaciones de muestra (varios estados)", consignaciones.count());
        log.info(" ");
        log.info("   documento: 11111111");
        log.info("   password : test1234");
        log.info("══════════════════════════════════════════════════");
    }

    // =================================================================
    // Países (catálogo legacy)
    // =================================================================

    private void seedPaises() {
        if (paises.count() > 0) return;
        paises.saveAll(List.of(
                Pais.builder().numero(32).nombre("Argentina").nombreCorto("ARG").capital("Buenos Aires").nacionalidad("Argentino/a").idiomas("Español").build(),
                Pais.builder().numero(76).nombre("Brasil").nombreCorto("BRA").capital("Brasilia").nacionalidad("Brasileño/a").idiomas("Portugués").build(),
                Pais.builder().numero(152).nombre("Chile").nombreCorto("CHL").capital("Santiago").nacionalidad("Chileno/a").idiomas("Español").build(),
                Pais.builder().numero(858).nombre("Uruguay").nombreCorto("URU").capital("Montevideo").nacionalidad("Uruguayo/a").idiomas("Español").build(),
                Pais.builder().numero(840).nombre("Estados Unidos").nombreCorto("USA").capital("Washington D.C.").nacionalidad("Estadounidense").idiomas("Inglés").build(),
                Pais.builder().numero(724).nombre("España").nombreCorto("ESP").capital("Madrid").nacionalidad("Español/a").idiomas("Español").build(),
                Pais.builder().numero(380).nombre("Italia").nombreCorto("ITA").capital("Roma").nacionalidad("Italiano/a").idiomas("Italiano").build()
        ));
    }

    // =================================================================
    // Subastas de muestra
    // =================================================================

    private void seedArteLatinoamericano(Usuario duenoDemo) {
        Subasta s = Subasta.builder()
                .titulo("Arte Latinoamericano del Siglo XX")
                .descripcion("Selección curada de óleos y esculturas de artistas argentinos, mexicanos y brasileños.")
                .fechaHoraInicio(LocalDateTime.now().plusHours(2))
                .ubicacion("Buenos Aires — Sala Principal")
                .categoriaRequerida(CategoriaUsuario.COMUN)
                .moneda(Moneda.ARS)
                .estado(EstadoSubasta.ABIERTA)
                .streamingUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Óleo sobre lienzo — \"Atardecer en La Boca\", anónimo, 1942. "
                        + "Recuperado de una colección privada de Mar del Plata. Restaurado en 2018.")
                .precioBase(new BigDecimal("250000"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("arte-01a", "arte-01b", "arte-01c"))
                .depositoNombre("Depósito Central")
                .depositoDireccion("Av. de los Constituyentes 1234")
                .depositoSector("A-12")
                .build();

        Pieza p2 = Pieza.builder()
                .numeroItem(2)
                .descripcion("Escultura en bronce — Figura femenina, 35 cm")
                .precioBase(new BigDecimal("180000"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("arte-02a", "arte-02b"))
                .depositoNombre("Depósito Central")
                .depositoDireccion("Av. de los Constituyentes 1234")
                .depositoSector("A-13")
                .build();

        Pieza p3 = Pieza.builder()
                .numeroItem(3)
                .descripcion("Acuarela enmarcada — \"Pueblo Andino\"")
                .precioBase(new BigDecimal("90000"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("arte-03a"))
                .depositoNombre("Depósito Central")
                .depositoDireccion("Av. de los Constituyentes 1234")
                .depositoSector("A-14")
                .build();

        attach(s, p1, p2, p3);
        s.setItemActual(p1);
        subastas.save(s);
    }

    private void seedRelojeria() {
        Subasta s = Subasta.builder()
                .titulo("Relojería Suiza Vintage")
                .descripcion("Piezas de colección — Patek, Rolex, Omega de los años 50 a 80.")
                .fechaHoraInicio(LocalDateTime.now().plusHours(4))
                .ubicacion("Buenos Aires — Sala VIP")
                .categoriaRequerida(CategoriaUsuario.PLATA)
                .moneda(Moneda.USD)
                .estado(EstadoSubasta.ABIERTA)
                .streamingUrl("https://www.twitch.tv/example")
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Rolex Submariner 1680, año 1972, caja original")
                .precioBase(new BigDecimal("8500"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("reloj-01a", "reloj-01b", "reloj-01c"))
                .build();

        Pieza p2 = Pieza.builder()
                .numeroItem(2)
                .descripcion("Omega Speedmaster Professional, 1969")
                .precioBase(new BigDecimal("4200"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("reloj-02a", "reloj-02b"))
                .build();

        attach(s, p1, p2);
        s.setItemActual(p1);
        subastas.save(s);
    }

    private void seedAutosClasicos() {
        Subasta s = Subasta.builder()
                .titulo("Autos Clásicos — Edición Otoño")
                .descripcion("Vehículos de colección con documentación al día.")
                .fechaHoraInicio(LocalDateTime.now().plusDays(2))
                .ubicacion("San Isidro — Hipódromo")
                .categoriaRequerida(CategoriaUsuario.ORO)
                .moneda(Moneda.USD)
                .estado(EstadoSubasta.PROXIMA)
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Ford Mustang 1967 — Restaurado, motor 289 V8 original")
                .precioBase(new BigDecimal("65000"))
                .estado(EstadoPieza.EN_EXHIBICION)
                .imagenes(images("auto-01a", "auto-01b", "auto-01c"))
                .build();

        Pieza p2 = Pieza.builder()
                .numeroItem(2)
                .descripcion("Citroën 2CV 1975 — Original, sin restaurar")
                .precioBase(new BigDecimal("12000"))
                .estado(EstadoPieza.EN_EXHIBICION)
                .imagenes(images("auto-02a", "auto-02b"))
                .build();

        attach(s, p1, p2);
        subastas.save(s);
    }

    private void seedJoyasOro() {
        Subasta s = Subasta.builder()
                .titulo("Joyería de Autor")
                .descripcion("Piezas únicas de orfebres argentinos contemporáneos.")
                .fechaHoraInicio(LocalDateTime.now().plusHours(8))
                .ubicacion("Buenos Aires — Sala Esmeralda")
                .categoriaRequerida(CategoriaUsuario.ESPECIAL)
                .moneda(Moneda.ARS)
                .estado(EstadoSubasta.ABIERTA)
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Anillo de oro 18k con esmeralda colombiana, talla princesa 2.4 ct")
                .precioBase(new BigDecimal("520000"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("joya-01a", "joya-01b"))
                .build();

        Pieza p2 = Pieza.builder()
                .numeroItem(2)
                .descripcion("Collar de perlas Akoya, broche de plata")
                .precioBase(new BigDecimal("180000"))
                .estado(EstadoPieza.EN_SUBASTA)
                .imagenes(images("joya-02a"))
                .build();

        attach(s, p1, p2);
        s.setItemActual(p1);
        subastas.save(s);
    }

    private void seedAntiguedadesProgramada() {
        Subasta s = Subasta.builder()
                .titulo("Antigüedades y Mobiliario")
                .descripcion("Muebles, vajilla y curiosidades del Río de la Plata, fines del XIX.")
                .fechaHoraInicio(LocalDateTime.now().plusDays(5))
                .ubicacion("Rosario — Galería del Centro")
                .categoriaRequerida(CategoriaUsuario.COMUN)
                .moneda(Moneda.ARS)
                .estado(EstadoSubasta.PROXIMA)
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Juego de Té de porcelana — 18 piezas, marca Limoges, c. 1890")
                .precioBase(new BigDecimal("75000"))
                .estado(EstadoPieza.EN_DEPOSITO)
                .imagenes(images("ant-01a", "ant-01b"))
                .build();

        Pieza p2 = Pieza.builder()
                .numeroItem(2)
                .descripcion("Escritorio de cedro tallado, c. 1880")
                .precioBase(new BigDecimal("220000"))
                .estado(EstadoPieza.EN_DEPOSITO)
                .imagenes(images("ant-02a"))
                .build();

        attach(s, p1, p2);
        subastas.save(s);
    }

    private void seedColeccionPlatino() {
        Subasta s = Subasta.builder()
                .titulo("Colección Privada — Acceso PLATINO")
                .descripcion("Sin tope de puja. Solo socios platino.")
                .fechaHoraInicio(LocalDateTime.now().plusDays(10))
                .ubicacion("Punta del Este — Casa Central")
                .categoriaRequerida(CategoriaUsuario.PLATINO)
                .moneda(Moneda.USD)
                .estado(EstadoSubasta.PROXIMA)
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Litografía firmada — Edición de 50, año 1985")
                .precioBase(new BigDecimal("25000"))
                .estado(EstadoPieza.EN_DEPOSITO)
                .imagenes(images("plat-01a"))
                .build();

        attach(s, p1);
        subastas.save(s);
    }

    private void seedFinalizadaVendida() {
        Subasta s = Subasta.builder()
                .titulo("Subasta Cerrada — Marzo 2026")
                .descripcion("Resultados finales de la subasta del mes pasado.")
                .fechaHoraInicio(LocalDateTime.now().minusDays(30))
                .ubicacion("Buenos Aires — Sala Principal")
                .categoriaRequerida(CategoriaUsuario.COMUN)
                .moneda(Moneda.ARS)
                .estado(EstadoSubasta.CERRADA)
                .build();

        Pieza p1 = Pieza.builder()
                .numeroItem(1)
                .descripcion("Vasija precolombina — Cultura Diaguita, c. siglo XII")
                .precioBase(new BigDecimal("400000"))
                .estado(EstadoPieza.VENDIDO)
                .imagenes(images("vendido-01a"))
                .mejorOferta(new BigDecimal("675000"))
                .build();

        attach(s, p1);
        subastas.save(s);
    }

    // =================================================================
    // Consignaciones del usuario en distintos estados
    // =================================================================

    private void seedConsignaciones(Usuario u) {
        // 1. PENDIENTE — recién enviada, esperando que la empresa la inspeccione
        consignaciones.save(Consignacion.builder()
                .usuario(u)
                .tipoBien("Reloj de bolsillo")
                .descripcion("Reloj de bolsillo de plata, herencia familiar c. 1920. Funciona, con leve desgaste en la caja.")
                .categoria("RELOJERIA")
                .declaraPropiedad(true)
                .declaraOrigenLicito(true)
                .fotos(images("cons-pen-01", "cons-pen-02", "cons-pen-03", "cons-pen-04", "cons-pen-05", "cons-pen-06"))
                .estado(EstadoConsignacion.PENDIENTE)
                .build());

        // 2. EN_INSPECCION — la empresa la está revisando físicamente
        consignaciones.save(Consignacion.builder()
                .usuario(u)
                .tipoBien("Pintura al óleo")
                .descripcion("Óleo sobre lienzo, paisaje rural, marco de madera tallada. Atribuible a escuela del Río de la Plata.")
                .categoria("ARTE")
                .artista("Atribuible — sin verificar")
                .declaraPropiedad(true)
                .declaraOrigenLicito(true)
                .fotos(images("cons-ins-01", "cons-ins-02", "cons-ins-03", "cons-ins-04", "cons-ins-05", "cons-ins-06"))
                .estado(EstadoConsignacion.EN_INSPECCION)
                .build());

        // 3. PENDIENTE_CONFIRMACION_USUARIO — empresa aceptó y propone valor
        consignaciones.save(Consignacion.builder()
                .usuario(u)
                .tipoBien("Vajilla de porcelana")
                .descripcion("Juego de Té de porcelana Limoges, 18 piezas, sin daños. Importado de Francia.")
                .categoria("ANTIGUEDADES")
                .declaraPropiedad(true)
                .declaraOrigenLicito(true)
                .fotos(images("cons-acc-01", "cons-acc-02", "cons-acc-03", "cons-acc-04", "cons-acc-05", "cons-acc-06"))
                .estado(EstadoConsignacion.PENDIENTE_CONFIRMACION_USUARIO)
                .precioBaseOfrecido(new BigDecimal("80000"))
                .comision(new BigDecimal("0.15"))
                .build());

        // 4. RECHAZADO — empresa rechazó tras inspección
        consignaciones.save(Consignacion.builder()
                .usuario(u)
                .tipoBien("Cuadro decorativo")
                .descripcion("Acuarela enmarcada, paisaje. Tamaño chico.")
                .categoria("ARTE")
                .declaraPropiedad(true)
                .declaraOrigenLicito(true)
                .fotos(images("cons-rec-01", "cons-rec-02", "cons-rec-03", "cons-rec-04", "cons-rec-05", "cons-rec-06"))
                .estado(EstadoConsignacion.RECHAZADO)
                .causaRechazo("La pieza no alcanza el valor mínimo de subasta para esta categoría.")
                .gastosDevolucion(new BigDecimal("3500"))
                .build());

        // 5. EN_SUBASTA — usuario aceptó la propuesta y está en próxima subasta
        consignaciones.save(Consignacion.builder()
                .usuario(u)
                .tipoBien("Anillo de oro")
                .descripcion("Anillo de oro 18k con esmeralda colombiana. Tasación adjunta.")
                .categoria("JOYA")
                .declaraPropiedad(true)
                .declaraOrigenLicito(true)
                .fotos(images("cons-sub-01", "cons-sub-02", "cons-sub-03", "cons-sub-04", "cons-sub-05", "cons-sub-06"))
                .estado(EstadoConsignacion.EN_SUBASTA)
                .precioBaseOfrecido(new BigDecimal("520000"))
                .comision(new BigDecimal("0.12"))
                .build());
    }

    // =================================================================
    // Helpers
    // =================================================================

    private static List<String> images(String... seeds) {
        List<String> urls = new ArrayList<>(seeds.length);
        for (String seed : seeds) {
            urls.add("https://picsum.photos/seed/" + seed + "/600/400");
        }
        return urls;
    }

    private static void attach(Subasta s, Pieza... piezas) {
        for (Pieza p : piezas) {
            p.setSubasta(s);
            s.getCatalogo().add(p);
        }
    }
}
