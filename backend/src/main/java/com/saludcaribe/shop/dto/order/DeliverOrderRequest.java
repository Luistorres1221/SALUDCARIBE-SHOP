package com.saludcaribe.shop.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class DeliverOrderRequest {

    @NotEmpty
    @Valid
    private List<DeliverItemRequest> items;

    private String notes;
}
