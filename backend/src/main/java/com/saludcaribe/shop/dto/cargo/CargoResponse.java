package com.saludcaribe.shop.dto.cargo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder
public class CargoResponse {
    private UUID id;
    private String name;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;
}
