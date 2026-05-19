package com.saludcaribe.shop.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userEmail;
    private BigDecimal total;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @Builder.Default
    private OrderStatus status = OrderStatus.pendiente;

    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
