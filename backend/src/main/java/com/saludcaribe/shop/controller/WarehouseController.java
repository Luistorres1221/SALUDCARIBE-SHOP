package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.warehouse.WarehouseRequest;
import com.saludcaribe.shop.dto.warehouse.WarehouseResponse;
import com.saludcaribe.shop.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping("/warehouses")
    public ResponseEntity<List<WarehouseResponse>> getActive() {
        return ResponseEntity.ok(warehouseService.findAllActive());
    }

    @GetMapping("/admin/warehouses")
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public ResponseEntity<List<WarehouseResponse>> getAll() {
        return ResponseEntity.ok(warehouseService.findAll());
    }

    @GetMapping("/admin/warehouses/{id}")
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public ResponseEntity<WarehouseResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(warehouseService.findById(id));
    }

    @PostMapping("/admin/warehouses")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<WarehouseResponse> create(@RequestBody WarehouseRequest req) {
        return ResponseEntity.ok(warehouseService.create(req));
    }

    @PutMapping("/admin/warehouses/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<WarehouseResponse> update(@PathVariable UUID id, @RequestBody WarehouseRequest req) {
        return ResponseEntity.ok(warehouseService.update(id, req));
    }
}
