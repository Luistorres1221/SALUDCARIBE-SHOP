package com.saludcaribe.shop.dto.product;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductRequest {
    @NotBlank
    private String sku;

    @NotBlank
    private String name;

    private String description;

    @NotNull @DecimalMin("0.0")
    private BigDecimal price;

    @NotNull @Min(0)
    private Integer stock;

    private String imageUrl;

    private UUID categoryId;
}
