package com.saludcaribe.shop.dto.order;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateOrderRequest {
    private String notes;

    @NotNull(message = "Debe seleccionar un centro de costo")
    private UUID costCenterId;

    @NotNull(message = "Debe seleccionar una dependencia")
    private UUID dependencyId;
}
