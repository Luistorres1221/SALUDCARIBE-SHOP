package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.product.*;
import com.saludcaribe.shop.model.Category;
import com.saludcaribe.shop.model.Product;
import com.saludcaribe.shop.repository.CategoryRepository;
import com.saludcaribe.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public List<ProductResponse> findAll(String q, UUID categoryId) {
        if (q != null && !q.isBlank()) {
            return productRepository.search(q).stream().map(this::toResponse).toList();
        }
        if (categoryId != null) {
            return productRepository.findByCategoryIdAndActiveTrueOrderByCreatedAtDesc(categoryId).stream().map(this::toResponse).toList();
        }
        return productRepository.findByActiveTrueOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findAllAdmin() {
        return productRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ProductResponse findById(UUID id) {
        return toResponse(productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado")));
    }

    public ProductResponse create(ProductRequest req) {
        if (productRepository.existsBySku(req.getSku())) {
            throw new IllegalArgumentException("El SKU ya existe");
        }
        Product p = buildProduct(new Product(), req);
        p.setCreatedAt(LocalDateTime.now());
        p.setActive(true);
        return toResponse(productRepository.save(p));
    }

    public ProductResponse update(UUID id, ProductRequest req) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        return toResponse(productRepository.save(buildProduct(p, req)));
    }

    public ProductResponse patch(UUID id, ProductPatchRequest req) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        if (req.getName() != null && !req.getName().isBlank()) p.setName(req.getName());
        if (req.getDescription() != null) p.setDescription(req.getDescription());
        if (req.getPrice() != null) p.setPrice(req.getPrice());
        if (req.getStock() != null) p.setStock(req.getStock());
        if (req.getImageUrl() != null) p.setImageUrl(req.getImageUrl());
        if (req.getCategoryId() != null) p.setCategoryId(req.getCategoryId());
        if (req.getActive() != null) p.setActive(req.getActive());
        return toResponse(productRepository.save(p));
    }

    public void delete(UUID id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        p.setActive(false);
        productRepository.save(p);
    }

    private Product buildProduct(Product p, ProductRequest req) {
        p.setSku(req.getSku());
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setStock(req.getStock());
        p.setImageUrl(req.getImageUrl());
        p.setCategoryId(req.getCategoryId());
        return p;
    }

    ProductResponse toResponse(Product p) {
        String categoryName = null;
        if (p.getCategoryId() != null) {
            categoryName = categoryRepository.findById(p.getCategoryId())
                    .map(Category::getName).orElse(null);
        }
        return ProductResponse.builder()
                .id(p.getId()).sku(p.getSku()).name(p.getName())
                .description(p.getDescription()).price(p.getPrice())
                .stock(p.getStock()).imageUrl(p.getImageUrl()).active(p.getActive())
                .categoryId(p.getCategoryId())
                .categoryName(categoryName)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
