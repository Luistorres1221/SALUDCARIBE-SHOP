package com.saludcaribe.shop.dto.internalorder;

import lombok.Data;
import java.util.UUID;

@Data
public class ApproveInternalOrderItemRequest {
    private UUID itemId;
    private Integer approvedQuantity;
}
