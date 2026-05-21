package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.OrderDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderDeliveryRepository extends JpaRepository<OrderDelivery, UUID> {

    @Query("SELECT d FROM OrderDelivery d WHERE d.orderId = :orderId ORDER BY d.deliveredAt DESC")
    List<OrderDelivery> findByOrderId(@Param("orderId") UUID orderId);
}
