package com.saludcaribe.shop.dto.transfer;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class TransferItemResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private Integer requestedQuantity;
    private Integer approvedQuantity;
    private Integer dispatchedQuantity;
    private Integer receivedQuantity;
}
