package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "internal_order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InternalOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internal_order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private InternalOrder internalOrder;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_sku")
    private String productSku;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Column(name = "approved_quantity")
    private Integer approvedQuantity;

    @Column(name = "delivered_quantity")
    private Integer deliveredQuantity;
}
