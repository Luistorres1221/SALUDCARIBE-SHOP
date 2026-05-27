package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Dependency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DependencyRepository extends JpaRepository<Dependency, UUID> {
    boolean existsByCode(String code);
    List<Dependency> findByActiveTrue();
}
