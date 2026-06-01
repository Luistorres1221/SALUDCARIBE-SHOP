package com.saludcaribe.shop.dto.inventory;

import com.saludcaribe.shop.model.MovementType;
import lombok.Data;
import java.util.UUID;

@Data
public class AdjustStockRequest {
    private UUID warehouseId;
    private UUID productId;
    private MovementType type;
    private Integer quantity;
    private String notes;
}
