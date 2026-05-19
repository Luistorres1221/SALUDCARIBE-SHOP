package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
