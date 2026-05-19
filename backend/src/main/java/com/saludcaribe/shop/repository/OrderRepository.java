package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o WHERE o.userId = :userId ORDER BY o.createdAt DESC NULLS LAST")
    List<Order> findByUserId(@Param("userId") UUID userId);

    @Override
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC NULLS LAST")
    List<Order> findAll();
}
