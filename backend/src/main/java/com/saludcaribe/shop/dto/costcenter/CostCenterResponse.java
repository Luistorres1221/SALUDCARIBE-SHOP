package com.saludcaribe.shop.dto.costcenter;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CostCenterResponse {
    private UUID id;
    private String code;
    private String name;
    private BigDecimal budget;
    private boolean active;
}
