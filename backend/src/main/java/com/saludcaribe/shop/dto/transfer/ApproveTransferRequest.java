package com.saludcaribe.shop.dto.transfer;

import lombok.Data;
import java.util.List;

@Data
public class ApproveTransferRequest {
    private String adminNotes;
    private List<ApproveTransferItemRequest> items;
}
