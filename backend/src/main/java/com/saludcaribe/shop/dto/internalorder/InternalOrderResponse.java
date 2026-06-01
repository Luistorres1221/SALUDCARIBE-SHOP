package com.saludcaribe.shop.dto.internalorder;

import com.saludcaribe.shop.model.InternalOrderStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InternalOrderResponse {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private String areaName;
    private UUID requestedBy;
    private String requestedByName;
    private String requestedByEmail;
    private UUID approvedBy;
    private String approvedByName;
    private UUID deliveredBy;
    private String deliveredByName;
    private String receivedByName;
    private InternalOrderStatus status;
    private String notes;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime deliveredAt;
    private List<InternalOrderItemResponse> items;
}
