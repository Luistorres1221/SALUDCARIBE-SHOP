package com.saludcaribe.shop.dto.batch;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ProductBatchRequest {

    @NotNull
    private UUID productId;

    @NotBlank
    private String batchNumber;

    @Min(1)
    private int initialQuantity;

    @Min(0)
    private int remainingQuantity;

    @NotNull
    private BigDecimal costPerUnit;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationDate;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate receivedDate;

    private boolean active = true;
}
