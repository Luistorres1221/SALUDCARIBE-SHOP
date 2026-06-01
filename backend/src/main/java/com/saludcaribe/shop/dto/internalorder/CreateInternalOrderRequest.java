package com.saludcaribe.shop.dto.internalorder;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreateInternalOrderRequest {
    private UUID warehouseId;
    private String areaName;
    private String notes;
    private List<InternalOrderItemRequest> items;
}
