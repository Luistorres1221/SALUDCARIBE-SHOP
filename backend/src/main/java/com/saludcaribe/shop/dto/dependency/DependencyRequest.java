package com.saludcaribe.shop.dto.dependency;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DependencyRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String name;
    private boolean active = true;
}
