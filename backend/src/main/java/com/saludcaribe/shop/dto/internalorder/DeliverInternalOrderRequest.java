package com.saludcaribe.shop.dto.internalorder;

import lombok.Data;

@Data
public class DeliverInternalOrderRequest {
    private String receivedByName;
    private String notes;
}
