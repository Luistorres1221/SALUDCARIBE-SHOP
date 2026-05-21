package com.saludcaribe.shop.model;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.util.UUID;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderDeliveryItem {
    private UUID itemId;
    private String productName;
    private Integer quantityDelivered;
}
