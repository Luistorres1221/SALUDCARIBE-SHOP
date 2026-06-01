package com.saludcaribe.shop.dto.user;

import com.saludcaribe.shop.model.AppRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UserRequest {
    @NotBlank @Email
    private String email;

    private String password;

    @NotBlank
    private String fullName;

    private String area;

    private UUID cargoId;

    private List<AppRole> roles;
}
