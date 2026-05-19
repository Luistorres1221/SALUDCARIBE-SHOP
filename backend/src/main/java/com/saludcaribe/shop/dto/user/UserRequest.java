package com.saludcaribe.shop.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRequest {
    @NotBlank @Email
    private String email;

    private String password;

    @NotBlank
    private String fullName;

    private String area;
}
