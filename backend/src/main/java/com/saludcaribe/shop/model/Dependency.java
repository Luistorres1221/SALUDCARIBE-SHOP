package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "dependencies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dependency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
