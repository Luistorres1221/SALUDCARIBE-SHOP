package com.saludcaribe.shop.dto.order;

import com.saludcaribe.shop.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderResponse {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userEmail;
    private String userArea;
    private OrderStatus status;
    private BigDecimal total;
    private String notes;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
    private List<OrderItemResponse> items;
    private List<DeliveryRecordResponse> deliveries;

    @Data
    @Builder
    public static class OrderItemResponse {
        private UUID id;
        private UUID productId;
        private String productName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private Integer deliveredQty;
        private Integer pendingQty;
        private BigDecimal subtotal;
    }
}
