package com.saludcaribe.shop.config;

import com.saludcaribe.shop.model.*;
import com.saludcaribe.shop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        dropLegacyStatusConstraint();
        seedAdmin();
        seedCategoriesAndProducts();
    }

    private void dropLegacyStatusConstraint() {
        try {
            jdbcTemplate.execute(
                "ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            log.info("Legacy orders_status_check constraint removed (or was already absent).");
        } catch (Exception e) {
            log.warn("Could not drop orders_status_check: {}", e.getMessage());
        }
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@saludcaribe.com")) {
            User admin = User.builder()
                    .email("admin@saludcaribe.com")
                    .password(passwordEncoder.encode("Admin1234!"))
                    .fullName("Administrador")
                    .area("Administración")
                    .createdAt(LocalDateTime.now())
                    .roles(new ArrayList<>(List.of(AppRole.admin)))
                    .build();
            userRepository.save(admin);
            log.info("Admin creado: admin@saludcaribe.com / Admin1234!");
        }
    }

    private void seedCategoriesAndProducts() {
        if (!productRepository.findAll().isEmpty()) return;

        // ── Categorías ──────────────────────────────────────────────────
        Category medica    = cat("Insumos Médicos",  "insumos-medicos",  "Material médico general",         "Stethoscope");
        Category odonto    = cat("Odontología",       "odontologia",      "Insumos para atención dental",    "Smile");
        Category enfer     = cat("Enfermería",        "enfermeria",       "Insumos para procedimientos",     "Sparkles");
        Category aseo      = cat("Aseo y Limpieza",   "aseo",             "Productos de higiene y limpieza", null);
        Category papeleria = cat("Papelería",         "papeleria",        "Materiales de oficina",           "FileText");

        // ── Insumos Médicos (4) ─────────────────────────────────────────
        prod("MED-001", "Guantes de Nitrilo Caja x100",     "Guantes desechables talla M, sin polvo, alta resistencia.",     45_000, 50, medica,    "https://picsum.photos/seed/guantes-nitrilo/400/400");
        prod("MED-002", "Mascarillas KN95 Caja x20",        "Protección FFP2, filtrado ≥95%, ajuste nasal moldeable.",       35_000, 80, medica,    "https://picsum.photos/seed/mascarilla-kn95/400/400");
        prod("MED-003", "Tensiómetro Digital de Brazo",     "Monitor automático, memoria 60 mediciones, manguito 22-42cm.", 185_000, 15, medica,    "https://picsum.photos/seed/tensiometro/400/400");
        prod("MED-004", "Termómetro Infrarrojo",            "Sin contacto, resultados en 1 segundo, rango 34-42.9°C.",       89_000, 25, medica,    "https://picsum.photos/seed/termometro/400/400");

        // ── Odontología (4) ────────────────────────────────────────────
        prod("ODO-001", "Espejos Bucales x12",              "Espejo doble cara #5, mango ergonómico de acero inoxidable.",   22_000, 40, odonto,    "https://picsum.photos/seed/espejo-bucal/400/400");
        prod("ODO-002", "Sonda Periodontal WHO",            "Sonda de bolsas periodontal, punta de bola 0.5mm, marcas mm.",  38_000, 30, odonto,    "https://picsum.photos/seed/sonda-periodontal/400/400");
        prod("ODO-003", "Eyectores de Saliva x100",         "Desechables, punta azul flexible, empaque estéril individual.", 18_000, 70, odonto,    "https://picsum.photos/seed/eyector-saliva/400/400");
        prod("ODO-004", "Alginato Kromopan 500g",           "Alginato cromático para impresiones dentales de alta fidelidad.", 68_000, 20, odonto,  "https://picsum.photos/seed/alginato/400/400");

        // ── Enfermería (5) ─────────────────────────────────────────────
        prod("ENF-001", "Gasas Estériles 10x10 cm x100",   "Tejido no tejido estéril, empaque individual sellado al vacío.",  32_000, 90, enfer,    "https://picsum.photos/seed/gasas-esteriles/400/400");
        prod("ENF-002", "Vendas Elásticas 10cm x10 und",   "Venda de crepé extensible, cierre con grapa metálica.",          38_000, 45, enfer,    "https://picsum.photos/seed/vendas-elasticas/400/400");
        prod("ENF-003", "Alcohol Antiséptico 500ml",        "Alcohol etílico 96°, para desinfección de superficies y piel.",  12_500,100, enfer,    "https://picsum.photos/seed/alcohol-antiseptico/400/400");
        prod("ENF-004", "Catéter IV 22G Caja x100",         "Catéter intravenoso con ala, aguja biselada trifacetada.",       88_000, 30, enfer,    "https://picsum.photos/seed/cateter-iv/400/400");
        prod("ENF-005", "Esparadrapo Micropore x6 rollos",  "Cinta médica de papel, hipoalergénica, 2.5cm x 9.1m.",          42_000, 50, enfer,    "https://picsum.photos/seed/esparadrapo/400/400");

        // ── Aseo (4) ───────────────────────────────────────────────────
        prod("ASE-001", "Jabón Antibacterial Galón 5L",     "Jabón líquido antibacterial, fragancia suave, pH neutro.",      28_000, 35, aseo,     "https://picsum.photos/seed/jabon-antibacterial/400/400");
        prod("ASE-002", "Desinfectante Multiusos 4L",       "Desinfectante de amplio espectro, elimina 99.9% gérmenes.",     24_000, 40, aseo,     "https://picsum.photos/seed/desinfectante/400/400");
        prod("ASE-003", "Hipoclorito de Sodio 5L",          "Concentración 5.25%, para desinfección de superficies.",        15_000, 50, aseo,     "https://picsum.photos/seed/hipoclorito/400/400");
        prod("ASE-004", "Bolsas Residuos Biológicos x50",   "Bolsas rojas para residuos peligrosos, calibre 4, 30x40cm.",   45_000, 25, aseo,     "https://picsum.photos/seed/bolsas-residuos/400/400");

        // ── Papelería (3) ──────────────────────────────────────────────
        prod("PAP-001", "Resma Papel A4 75g 500 Hojas",     "Papel blanco de alta blancura (92%), apto para láser e inyección.", 18_000, 30, papeleria, "https://picsum.photos/seed/papel-a4/400/400");
        prod("PAP-002", "Bolígrafos Negros x12",            "Bolígrafo de punta fina 0.7mm, tinta de secado rápido.",         8_500, 60, papeleria, "https://picsum.photos/seed/boligrafo/400/400");
        prod("PAP-003", "Tóner HP LaserJet Negro",          "Tóner compatible HP 85A, rendimiento 1600 páginas.",           185_000,  8, papeleria, "https://picsum.photos/seed/toner-hp/400/400");

        log.info("Datos iniciales cargados: 5 categorías, 20 productos.");
    }

    private Category cat(String name, String slug, String description, String icon) {
        Category c = Category.builder()
                .name(name).slug(slug).description(description).icon(icon)
                .build();
        return categoryRepository.save(c);
    }

    private void prod(String sku, String name, String description,
                      long priceCOP, int stock, Category category, String imageUrl) {
        Product p = Product.builder()
                .sku(sku).name(name).description(description)
                .price(BigDecimal.valueOf(priceCOP))
                .stock(stock)
                .categoryId(category.getId())
                .imageUrl(imageUrl)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
        productRepository.save(p);
    }
}
