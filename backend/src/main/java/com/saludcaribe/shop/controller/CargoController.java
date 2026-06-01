package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.cargo.CargoRequest;
import com.saludcaribe.shop.dto.cargo.CargoResponse;
import com.saludcaribe.shop.service.CargoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/cargos")
@RequiredArgsConstructor
public class CargoController {

    private final CargoService cargoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public List<CargoResponse> findAll() {
        return cargoService.findAll();
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public List<CargoResponse> findActive() {
        return cargoService.findActive();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public CargoResponse findById(@PathVariable UUID id) {
        return cargoService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<CargoResponse> create(@Valid @RequestBody CargoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cargoService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public CargoResponse update(@PathVariable UUID id, @Valid @RequestBody CargoRequest req) {
        return cargoService.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('admin')")
    public CargoResponse toggleActive(@PathVariable UUID id) {
        return cargoService.toggleActive(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        cargoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
