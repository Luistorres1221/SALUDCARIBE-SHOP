package com.saludcaribe.shop.dto.internalorder;

import lombok.Data;
import java.util.UUID;

@Data
public class InternalOrderItemRequest {
    private UUID productId;
    private Integer requestedQuantity;
}
