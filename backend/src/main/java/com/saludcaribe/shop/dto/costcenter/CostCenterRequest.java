package com.saludcaribe.shop.dto.costcenter;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CostCenterRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String name;
    private BigDecimal budget;
    private boolean active = true;
}
