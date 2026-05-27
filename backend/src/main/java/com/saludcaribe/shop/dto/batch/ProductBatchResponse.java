package com.saludcaribe.shop.dto.batch;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProductBatchResponse {

    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private String categoryName;
    private String batchNumber;
    private int initialQuantity;
    private int remainingQuantity;
    private BigDecimal costPerUnit;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate receivedDate;

    private boolean active;
    private LocalDateTime createdAt;

    /** "vigente" | "por_vencer" | "vencido" */
    private String status;

    /** remainingQuantity × costPerUnit */
    private BigDecimal totalValue;
}
