package com.saludcaribe.shop.dto.user;

import com.saludcaribe.shop.model.AppRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String area;
    private UUID cargoId;
    private String cargoName;
    private List<AppRole> roles;
    private LocalDateTime createdAt;
}
