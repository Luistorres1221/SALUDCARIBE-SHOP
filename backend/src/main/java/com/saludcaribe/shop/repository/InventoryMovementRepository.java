package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    List<InventoryMovement> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId);
    List<InventoryMovement> findByProductIdOrderByCreatedAtDesc(UUID productId);
    List<InventoryMovement> findByWarehouseIdAndProductIdOrderByCreatedAtDesc(UUID warehouseId, UUID productId);
    List<InventoryMovement> findByReferenceId(UUID referenceId);

    @Query("SELECT m FROM InventoryMovement m WHERE m.createdAt BETWEEN :from AND :to ORDER BY m.createdAt DESC")
    List<InventoryMovement> findByDateRange(LocalDateTime from, LocalDateTime to);

    @Query("SELECT m FROM InventoryMovement m WHERE m.warehouseId = :warehouseId AND m.createdAt BETWEEN :from AND :to ORDER BY m.createdAt DESC")
    List<InventoryMovement> findByWarehouseAndDateRange(UUID warehouseId, LocalDateTime from, LocalDateTime to);
}
