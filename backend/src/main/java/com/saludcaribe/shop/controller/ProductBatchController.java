package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.batch.ProductBatchRequest;
import com.saludcaribe.shop.dto.batch.ProductBatchResponse;
import com.saludcaribe.shop.service.ProductBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/batches")
@PreAuthorize("hasRole('admin')")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService service;

    @GetMapping
    public List<ProductBatchResponse> listAll() {
        return service.findAllAdmin();
    }

    @GetMapping("/expired")
    public List<ProductBatchResponse> listExpired() {
        return service.findExpired();
    }

    @GetMapping("/expiring-soon")
    public List<ProductBatchResponse> listExpiringSoon(
            @RequestParam(defaultValue = "30") int days) {
        return service.findExpiringSoon(days);
    }

    @PostMapping
    public ResponseEntity<ProductBatchResponse> create(
            @Valid @RequestBody ProductBatchRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ProductBatchResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductBatchRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
