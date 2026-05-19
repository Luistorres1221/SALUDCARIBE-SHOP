package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    private String userFullName;
    private String userEmail;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    @Column(length = 1000)
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.pendiente;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
