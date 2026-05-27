package com.saludcaribe.shop.dto.dependency;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class DependencyResponse {
    private UUID id;
    private String code;
    private String name;
    private boolean active;
}
