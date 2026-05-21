package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByActiveTrueOrderByCreatedAtDesc();

    List<Product> findByCategoryIdAndActiveTrueOrderByCreatedAtDesc(UUID categoryId);

    @Query("SELECT p FROM Product p WHERE p.active = true AND LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY p.createdAt DESC NULLS LAST")
    List<Product> search(@Param("q") String q);

    boolean existsBySku(String sku);

    @Override
    @Query("SELECT p FROM Product p ORDER BY p.createdAt DESC NULLS LAST")
    List<Product> findAll();
}
