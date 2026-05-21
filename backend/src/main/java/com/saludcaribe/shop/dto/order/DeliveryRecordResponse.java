package com.saludcaribe.shop.dto.order;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DeliveryRecordResponse {

    private UUID id;
    private LocalDateTime deliveredAt;
    private String adminEmail;
    private String notes;
    private List<DeliveryItemResponse> items;

    @Data
    @Builder
    public static class DeliveryItemResponse {
        private UUID itemId;
        private String productName;
        private Integer quantityDelivered;
    }
}
