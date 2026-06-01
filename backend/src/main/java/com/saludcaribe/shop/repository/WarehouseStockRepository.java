package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, UUID> {
    List<WarehouseStock> findByWarehouseId(UUID warehouseId);
    Optional<WarehouseStock> findByWarehouseIdAndProductId(UUID warehouseId, UUID productId);
    List<WarehouseStock> findByProductId(UUID productId);

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.warehouseId = :warehouseId AND ws.quantity > 0 AND ws.quantity <= ws.minimumStock")
    List<WarehouseStock> findLowStockByWarehouse(UUID warehouseId);

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.warehouseId = :warehouseId AND ws.quantity = 0")
    List<WarehouseStock> findOutOfStockByWarehouse(UUID warehouseId);
}
