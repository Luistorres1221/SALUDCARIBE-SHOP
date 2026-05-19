package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    private Integer stock;

    @Column(length = 1000)
    private String imageUrl;

    private UUID categoryId;
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
