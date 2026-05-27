package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.costcenter.CostCenterRequest;
import com.saludcaribe.shop.dto.costcenter.CostCenterResponse;
import com.saludcaribe.shop.service.CostCenterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CostCenterController {

    private final CostCenterService service;

    /** Todos los usuarios autenticados pueden listar los centros de costo activos */
    @GetMapping("/api/cost-centers")
    public List<CostCenterResponse> listActive() {
        return service.findAllActive();
    }

    /** Admin: lista todos (activos e inactivos) */
    @GetMapping("/api/admin/cost-centers")
    @PreAuthorize("hasRole('admin')")
    public List<CostCenterResponse> listAll() {
        return service.findAll();
    }

    @PostMapping("/api/admin/cost-centers")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<CostCenterResponse> create(@Valid @RequestBody CostCenterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/api/admin/cost-centers/{id}")
    @PreAuthorize("hasRole('admin')")
    public CostCenterResponse update(@PathVariable UUID id, @Valid @RequestBody CostCenterRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/api/admin/cost-centers/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
