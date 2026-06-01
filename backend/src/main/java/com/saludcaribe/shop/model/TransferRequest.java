package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "transfer_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "from_warehouse_id", nullable = false)
    private UUID fromWarehouseId;

    @Column(name = "from_warehouse_name")
    private String fromWarehouseName;

    @Column(name = "to_warehouse_id", nullable = false)
    private UUID toWarehouseId;

    @Column(name = "to_warehouse_name")
    private String toWarehouseName;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_by_name")
    private String approvedByName;

    @Column(name = "dispatched_by")
    private UUID dispatchedBy;

    @Column(name = "dispatched_by_name")
    private String dispatchedByName;

    @Column(name = "received_by")
    private UUID receivedBy;

    @Column(name = "received_by_name")
    private String receivedByName;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferStatus status = TransferStatus.PENDIENTE;

    @Column(length = 1000)
    private String notes;

    @Column(name = "admin_notes", length = 2000)
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;

    @OneToMany(mappedBy = "transferRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransferRequestItem> items;
}
