package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ProductBatchRepository extends JpaRepository<ProductBatch, UUID> {

    List<ProductBatch> findByActiveTrueOrderByExpirationDateAsc();

    List<ProductBatch> findByProductIdAndActiveTrue(UUID productId);

    List<ProductBatch> findByExpirationDateBeforeAndActiveTrueAndRemainingQuantityGreaterThan(
            LocalDate date, int qty);

    List<ProductBatch> findByExpirationDateBetweenAndActiveTrueAndRemainingQuantityGreaterThan(
            LocalDate from, LocalDate to, int qty);
}
