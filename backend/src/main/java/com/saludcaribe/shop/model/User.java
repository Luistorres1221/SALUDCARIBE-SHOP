package com.saludcaribe.shop.model;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    private UUID id;
    private String email;
    private String password;
    private String fullName;
    private String area;
    private LocalDateTime createdAt;

    @Builder.Default
    private List<AppRole> roles = new ArrayList<>();
}
