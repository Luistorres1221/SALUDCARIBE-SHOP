package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "internal_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InternalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "warehouse_name")
    private String warehouseName;

    @Column(name = "area_name")
    private String areaName;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "requested_by_email")
    private String requestedByEmail;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_by_name")
    private String approvedByName;

    @Column(name = "delivered_by")
    private UUID deliveredBy;

    @Column(name = "delivered_by_name")
    private String deliveredByName;

    @Column(name = "received_by_name")
    private String receivedByName;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternalOrderStatus status = InternalOrderStatus.PENDIENTE;

    @Column(length = 1000)
    private String notes;

    @Column(name = "admin_notes", length = 2000)
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "internalOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InternalOrderItem> items;
}
