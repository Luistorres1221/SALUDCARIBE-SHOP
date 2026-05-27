package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_batches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false, length = 100)
    private String batchNumber;

    @Column(nullable = false)
    private int initialQuantity;

    @Column(nullable = false)
    private int remainingQuantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costPerUnit;

    @Column(nullable = false)
    private LocalDate expirationDate;

    @Column(nullable = false)
    private LocalDate receivedDate;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
