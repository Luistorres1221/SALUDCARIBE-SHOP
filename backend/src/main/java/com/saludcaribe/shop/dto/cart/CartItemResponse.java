package com.saludcaribe.shop.dto.cart;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder
public class CartItemResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private BigDecimal productPrice;
    private String productImageUrl;
    private Integer productStock;
    private Integer quantity;
    private BigDecimal subtotal;
}
