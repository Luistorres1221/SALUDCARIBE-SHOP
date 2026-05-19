package com.saludcaribe.shop.model;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {
    private UUID id;
    private UUID userId;
    private UUID productId;
    private String productName;
    private String productSku;
    private BigDecimal productPrice;
    private String productImageUrl;
    private Integer productStock;
    private Integer quantity;
}
