package com.saludcaribe.shop.dto.warehouse;

import com.saludcaribe.shop.model.WarehouseType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WarehouseResponse {
    private UUID id;
    private String code;
    private String name;
    private String location;
    private String description;
    private WarehouseType type;
    private Boolean active;
    private LocalDateTime createdAt;
}
