package com.saludcaribe.shop.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String slug;

    private String description;
    private String icon;
    private String imageUrl;
}
