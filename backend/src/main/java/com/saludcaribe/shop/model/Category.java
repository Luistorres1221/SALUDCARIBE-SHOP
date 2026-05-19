package com.saludcaribe.shop.model;

import lombok.*;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String icon;
    private String imageUrl;
}
