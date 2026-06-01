package com.saludcaribe.shop.dto.inventory;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class WarehouseStockResponse {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private UUID productId;
    private String productName;
    private String productSku;
    private BigDecimal productPrice;
    private Integer quantity;
    private Integer minimumStock;
    private boolean lowStock;
    private boolean outOfStock;
}
