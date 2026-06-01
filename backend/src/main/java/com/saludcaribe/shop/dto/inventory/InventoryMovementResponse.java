package com.saludcaribe.shop.dto.inventory;

import com.saludcaribe.shop.model.MovementType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InventoryMovementResponse {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private UUID productId;
    private String productName;
    private String productSku;
    private MovementType type;
    private String typeLabel;
    private Integer quantity;
    private Integer previousStock;
    private Integer newStock;
    private UUID referenceId;
    private String referenceType;
    private String notes;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
}
