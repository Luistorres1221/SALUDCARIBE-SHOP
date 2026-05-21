package com.saludcaribe.shop.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    private UUID id;
    private UUID productId;

    @Column(nullable = false)
    private String productName;

    @Column(precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Builder.Default
    private Integer deliveredQty = 0;
}
