package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.CostCenter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CostCenterRepository extends JpaRepository<CostCenter, UUID> {
    boolean existsByCode(String code);
    List<CostCenter> findByActiveTrue();
}
