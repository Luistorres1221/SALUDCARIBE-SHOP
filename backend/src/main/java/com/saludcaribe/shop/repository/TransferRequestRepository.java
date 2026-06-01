package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.TransferRequest;
import com.saludcaribe.shop.model.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface TransferRequestRepository extends JpaRepository<TransferRequest, UUID> {
    @Query("SELECT t FROM TransferRequest t ORDER BY t.createdAt DESC NULLS LAST")
    List<TransferRequest> findAllOrderByCreatedAtDesc();

    List<TransferRequest> findByToWarehouseIdOrderByCreatedAtDesc(UUID toWarehouseId);
    List<TransferRequest> findByFromWarehouseIdOrderByCreatedAtDesc(UUID fromWarehouseId);
    List<TransferRequest> findByStatusOrderByCreatedAtDesc(TransferStatus status);
    List<TransferRequest> findByRequestedByOrderByCreatedAtDesc(UUID requestedBy);
}
