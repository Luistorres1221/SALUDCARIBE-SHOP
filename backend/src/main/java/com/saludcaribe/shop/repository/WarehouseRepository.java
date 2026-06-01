package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {
    List<Warehouse> findByActiveTrueOrderByTypeAscNameAsc();
    Optional<Warehouse> findByCode(String code);
    boolean existsByCode(String code);
}
