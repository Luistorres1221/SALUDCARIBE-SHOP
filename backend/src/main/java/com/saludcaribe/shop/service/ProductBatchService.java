package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.batch.ProductBatchRequest;
import com.saludcaribe.shop.dto.batch.ProductBatchResponse;
import com.saludcaribe.shop.model.Category;
import com.saludcaribe.shop.model.Product;
import com.saludcaribe.shop.model.ProductBatch;
import com.saludcaribe.shop.repository.CategoryRepository;
import com.saludcaribe.shop.repository.ProductBatchRepository;
import com.saludcaribe.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductBatchService {

    private final ProductBatchRepository repository;
    private final ProductRepository      productRepository;
    private final CategoryRepository     categoryRepository;

    private static final int EXPIRING_SOON_DAYS = 30;

    public List<ProductBatchResponse> findAll() {
        return repository.findByActiveTrueOrderByExpirationDateAsc()
                .stream().map(this::toResponse).toList();
    }

    public List<ProductBatchResponse> findAllAdmin() {
        return repository.findAll().stream()
                .sorted((a, b) -> a.getExpirationDate().compareTo(b.getExpirationDate()))
                .map(this::toResponse).toList();
    }

    public List<ProductBatchResponse> findExpired() {
        return repository
                .findByExpirationDateBeforeAndActiveTrueAndRemainingQuantityGreaterThan(
                        LocalDate.now(), 0)
                .stream().map(this::toResponse).toList();
    }

    public List<ProductBatchResponse> findExpiringSoon(int days) {
        LocalDate from = LocalDate.now();
        LocalDate to   = from.plusDays(days);
        return repository
                .findByExpirationDateBetweenAndActiveTrueAndRemainingQuantityGreaterThan(from, to, 0)
                .stream().map(this::toResponse).toList();
    }

    public ProductBatchResponse create(ProductBatchRequest req) {
        ProductBatch batch = ProductBatch.builder()
                .productId(req.getProductId())
                .batchNumber(req.getBatchNumber().trim().toUpperCase())
                .initialQuantity(req.getInitialQuantity())
                .remainingQuantity(req.getRemainingQuantity())
                .costPerUnit(req.getCostPerUnit())
                .expirationDate(req.getExpirationDate())
                .receivedDate(req.getReceivedDate())
                .active(req.isActive())
                .createdAt(LocalDateTime.now())
                .build();
        return toResponse(repository.save(batch));
    }

    public ProductBatchResponse update(UUID id, ProductBatchRequest req) {
        ProductBatch batch = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));
        batch.setProductId(req.getProductId());
        batch.setBatchNumber(req.getBatchNumber().trim().toUpperCase());
        batch.setInitialQuantity(req.getInitialQuantity());
        batch.setRemainingQuantity(req.getRemainingQuantity());
        batch.setCostPerUnit(req.getCostPerUnit());
        batch.setExpirationDate(req.getExpirationDate());
        batch.setReceivedDate(req.getReceivedDate());
        batch.setActive(req.isActive());
        return toResponse(repository.save(batch));
    }

    public void delete(UUID id) {
        ProductBatch batch = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));
        batch.setActive(false);
        repository.save(batch);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ProductBatchResponse toResponse(ProductBatch b) {
        Product product     = productRepository.findById(b.getProductId()).orElse(null);
        String  productName = product != null ? product.getName() : "—";
        String  productSku  = product != null ? product.getSku()  : "—";

        String catName = null;
        if (product != null && product.getCategoryId() != null) {
            catName = categoryRepository.findById(product.getCategoryId())
                    .map(Category::getName).orElse(null);
        }

        LocalDate today = LocalDate.now();
        String status;
        if (b.getExpirationDate().isBefore(today)) {
            status = "vencido";
        } else if (!b.getExpirationDate().isAfter(today.plusDays(EXPIRING_SOON_DAYS))) {
            status = "por_vencer";
        } else {
            status = "vigente";
        }

        BigDecimal totalValue = b.getCostPerUnit()
                .multiply(BigDecimal.valueOf(b.getRemainingQuantity()));

        return ProductBatchResponse.builder()
                .id(b.getId())
                .productId(b.getProductId())
                .productName(productName)
                .productSku(productSku)
                .categoryName(catName)
                .batchNumber(b.getBatchNumber())
                .initialQuantity(b.getInitialQuantity())
                .remainingQuantity(b.getRemainingQuantity())
                .costPerUnit(b.getCostPerUnit())
                .expirationDate(b.getExpirationDate())
                .receivedDate(b.getReceivedDate())
                .active(b.isActive())
                .createdAt(b.getCreatedAt())
                .status(status)
                .totalValue(totalValue)
                .build();
    }
}
