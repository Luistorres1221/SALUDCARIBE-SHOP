package com.saludcaribe.shop.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "cost_centers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CostCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(precision = 15, scale = 2)
    private BigDecimal budget;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
