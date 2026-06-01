package com.saludcaribe.shop.dto.auth;

import lombok.Data;

@Data
public class RefreshRequest {
    private String refreshToken;
}
