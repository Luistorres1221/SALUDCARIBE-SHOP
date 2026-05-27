package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.dependency.DependencyRequest;
import com.saludcaribe.shop.dto.dependency.DependencyResponse;
import com.saludcaribe.shop.service.DependencyService;
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
public class DependencyController {

    private final DependencyService service;

    /** Todos los usuarios autenticados pueden listar las dependencias activas */
    @GetMapping("/api/dependencies")
    public List<DependencyResponse> listActive() {
        return service.findAllActive();
    }

    /** Admin: lista todas (activas e inactivas) */
    @GetMapping("/api/admin/dependencies")
    @PreAuthorize("hasRole('admin')")
    public List<DependencyResponse> listAll() {
        return service.findAll();
    }

    @PostMapping("/api/admin/dependencies")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<DependencyResponse> create(@Valid @RequestBody DependencyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/api/admin/dependencies/{id}")
    @PreAuthorize("hasRole('admin')")
    public DependencyResponse update(@PathVariable UUID id, @Valid @RequestBody DependencyRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/api/admin/dependencies/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
