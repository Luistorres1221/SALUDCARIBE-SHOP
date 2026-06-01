package com.saludcaribe.shop.dto.transfer;

import lombok.Data;
import java.util.UUID;

@Data
public class ApproveTransferItemRequest {
    private UUID itemId;
    private Integer approvedQuantity;
}
