package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.InternalOrder;
import com.saludcaribe.shop.model.InternalOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface InternalOrderRepository extends JpaRepository<InternalOrder, UUID> {
    @Query("SELECT io FROM InternalOrder io ORDER BY io.createdAt DESC NULLS LAST")
    List<InternalOrder> findAllOrderByCreatedAtDesc();

    List<InternalOrder> findByRequestedByOrderByCreatedAtDesc(UUID requestedBy);
    List<InternalOrder> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId);
    List<InternalOrder> findByStatusOrderByCreatedAtDesc(InternalOrderStatus status);
}
