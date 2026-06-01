package com.saludcaribe.shop.dto.transfer;

import com.saludcaribe.shop.model.TransferStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TransferResponse {
    private UUID id;
    private UUID fromWarehouseId;
    private String fromWarehouseName;
    private UUID toWarehouseId;
    private String toWarehouseName;
    private UUID requestedBy;
    private String requestedByName;
    private UUID approvedBy;
    private String approvedByName;
    private UUID dispatchedBy;
    private String dispatchedByName;
    private UUID receivedBy;
    private String receivedByName;
    private TransferStatus status;
    private String notes;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
    private List<TransferItemResponse> items;
}
