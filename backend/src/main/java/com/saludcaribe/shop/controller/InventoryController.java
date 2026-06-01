package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.inventory.*;
import com.saludcaribe.shop.model.User;
import com.saludcaribe.shop.repository.UserRepository;
import com.saludcaribe.shop.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/inventory")
@PreAuthorize("hasRole('admin')")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @GetMapping("/stock")
    public ResponseEntity<List<WarehouseStockResponse>> getAllStock() {
        return ResponseEntity.ok(inventoryService.getAllStock());
    }

    @GetMapping("/stock/warehouse/{warehouseId}")
    public ResponseEntity<List<WarehouseStockResponse>> getStockByWarehouse(@PathVariable UUID warehouseId) {
        return ResponseEntity.ok(inventoryService.getStockByWarehouse(warehouseId));
    }

    @GetMapping("/stock/low/{warehouseId}")
    public ResponseEntity<List<WarehouseStockResponse>> getLowStock(@PathVariable UUID warehouseId) {
        return ResponseEntity.ok(inventoryService.getLowStock(warehouseId));
    }

    @GetMapping("/stock/out-of-stock/{warehouseId}")
    public ResponseEntity<List<WarehouseStockResponse>> getOutOfStock(@PathVariable UUID warehouseId) {
        return ResponseEntity.ok(inventoryService.getOutOfStock(warehouseId));
    }

    @PostMapping("/entry")
    public ResponseEntity<InventoryMovementResponse> recordEntry(
            @RequestBody StockEntryRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(inventoryService.recordEntry(req, user.getId(), user.getFullName()));
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryMovementResponse> adjustStock(
            @RequestBody AdjustStockRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(inventoryService.adjustStock(req, user.getId(), user.getFullName()));
    }

    @GetMapping("/kardex/{productId}")
    public ResponseEntity<List<InventoryMovementResponse>> getKardex(
            @PathVariable UUID productId,
            @RequestParam(required = false) UUID warehouseId) {
        return ResponseEntity.ok(inventoryService.getKardex(productId, warehouseId));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<InventoryMovementResponse>> getAllMovements() {
        return ResponseEntity.ok(inventoryService.getAllMovements());
    }

    @GetMapping("/movements/warehouse/{warehouseId}")
    public ResponseEntity<List<InventoryMovementResponse>> getMovementsByWarehouse(@PathVariable UUID warehouseId) {
        return ResponseEntity.ok(inventoryService.getMovementsByWarehouse(warehouseId));
    }
}
