package com.saludcaribe.shop.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class DeliverItemRequest {
    @NotNull
    private UUID itemId;

    @NotNull
    @Min(0)
    private Integer deliveredQty;
}
