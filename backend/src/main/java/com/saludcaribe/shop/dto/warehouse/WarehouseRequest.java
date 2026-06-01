package com.saludcaribe.shop.dto.warehouse;

import com.saludcaribe.shop.model.WarehouseType;
import lombok.Data;

@Data
public class WarehouseRequest {
    private String code;
    private String name;
    private String location;
    private String description;
    private WarehouseType type;
    private Boolean active;
}
