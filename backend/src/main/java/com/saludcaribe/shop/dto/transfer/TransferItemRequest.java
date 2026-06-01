package com.saludcaribe.shop.dto.transfer;

import lombok.Data;
import java.util.UUID;

@Data
public class TransferItemRequest {
    private UUID productId;
    private Integer requestedQuantity;
}
