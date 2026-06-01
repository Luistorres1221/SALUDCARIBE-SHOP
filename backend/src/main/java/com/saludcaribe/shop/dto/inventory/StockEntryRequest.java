package com.saludcaribe.shop.dto.inventory;

import lombok.Data;
import java.util.UUID;

@Data
public class StockEntryRequest {
    private UUID warehouseId;
    private UUID productId;
    private Integer quantity;
    private String notes;
}
