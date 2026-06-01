package com.saludcaribe.shop.dto.cargo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CargoRequest {
    @NotBlank(message = "El nombre del cargo es obligatorio")
    private String name;

    private String description;

    private Boolean active;
}
