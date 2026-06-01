package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "transfer_request_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransferRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_request_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TransferRequest transferRequest;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_sku")
    private String productSku;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Column(name = "approved_quantity")
    private Integer approvedQuantity;

    @Column(name = "dispatched_quantity")
    private Integer dispatchedQuantity;

    @Column(name = "received_quantity")
    private Integer receivedQuantity;
}
