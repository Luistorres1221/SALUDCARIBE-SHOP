package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "cart_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID productId;

    private String productName;
    private String productSku;

    @Column(precision = 12, scale = 2)
    private BigDecimal productPrice;

    @Column(length = 1000)
    private String productImageUrl;

    private Integer productStock;

    @Column(nullable = false)
    private Integer quantity;
}
