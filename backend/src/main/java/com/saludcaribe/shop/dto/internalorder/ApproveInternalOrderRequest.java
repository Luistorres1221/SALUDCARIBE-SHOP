package com.saludcaribe.shop.dto.internalorder;

import lombok.Data;
import java.util.List;

@Data
public class ApproveInternalOrderRequest {
    private String adminNotes;
    private List<ApproveInternalOrderItemRequest> items;
}
