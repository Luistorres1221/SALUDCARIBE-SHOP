package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.category.*;
import com.saludcaribe.shop.model.Category;
import com.saludcaribe.shop.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CategoryResponse findById(UUID id) {
        return toResponse(categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada")));
    }

    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsBySlug(req.getSlug())) {
            throw new IllegalArgumentException("El slug ya existe");
        }
        Category cat = Category.builder()
                .name(req.getName()).slug(req.getSlug())
                .description(req.getDescription()).icon(req.getIcon())
                .imageUrl(req.getImageUrl())
                .build();
        return toResponse(categoryRepository.save(cat));
    }

    public CategoryResponse update(UUID id, CategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
        cat.setName(req.getName());
        cat.setSlug(req.getSlug());
        cat.setDescription(req.getDescription());
        cat.setIcon(req.getIcon());
        cat.setImageUrl(req.getImageUrl());
        return toResponse(categoryRepository.save(cat));
    }

    public void delete(UUID id) {
        categoryRepository.deleteById(id);
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId()).name(c.getName()).slug(c.getSlug())
                .description(c.getDescription()).icon(c.getIcon())
                .imageUrl(c.getImageUrl())
                .build();
    }
}
