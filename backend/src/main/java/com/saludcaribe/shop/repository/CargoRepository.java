package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CargoRepository extends JpaRepository<Cargo, UUID> {
    List<Cargo> findAllByOrderByNameAsc();
    List<Cargo> findByActiveTrue();
    boolean existsByNameIgnoreCase(String name);
}
