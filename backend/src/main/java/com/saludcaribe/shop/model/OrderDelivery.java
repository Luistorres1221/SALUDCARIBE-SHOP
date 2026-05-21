package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "order_deliveries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    private LocalDateTime deliveredAt;
    private String adminEmail;

    @Column(length = 2000)
    private String notes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_delivery_items", joinColumns = @JoinColumn(name = "delivery_id"))
    @Builder.Default
    private List<OrderDeliveryItem> items = new ArrayList<>();
}
