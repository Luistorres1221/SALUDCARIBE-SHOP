package com.saludcaribe.shop.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class DeliverOrderRequest {

    @NotEmpty
    @Valid
    private List<DeliverItemRequest> items;

    private String notes;

    /** Bodega de la que se descuenta el stock al entregar. Opcional: si es null se omite el movimiento de inventario. */
    private UUID warehouseId;
}
