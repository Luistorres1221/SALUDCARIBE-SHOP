package com.saludcaribe.shop.dto.auth;

import com.saludcaribe.shop.model.AppRole;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UUID userId;
    private String email;
    private String fullName;
    private String area;
    private List<AppRole> roles;
}
