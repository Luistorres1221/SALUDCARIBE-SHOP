package com.saludcaribe.shop.dto.transfer;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreateTransferRequest {
    private UUID fromWarehouseId;
    private UUID toWarehouseId;
    private String notes;
    private List<TransferItemRequest> items;
}
