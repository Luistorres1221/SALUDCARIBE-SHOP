package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.dependency.DependencyRequest;
import com.saludcaribe.shop.dto.dependency.DependencyResponse;
import com.saludcaribe.shop.model.Dependency;
import com.saludcaribe.shop.repository.DependencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DependencyService {

    private final DependencyRepository repository;

    public List<DependencyResponse> findAllActive() {
        return repository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public List<DependencyResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public DependencyResponse create(DependencyRequest req) {
        if (repository.existsByCode(req.getCode())) {
            throw new IllegalArgumentException("Ya existe una dependencia con el código: " + req.getCode());
        }
        Dependency dep = Dependency.builder()
                .code(req.getCode().trim().toUpperCase())
                .name(req.getName().trim())
                .active(req.isActive())
                .build();
        return toResponse(repository.save(dep));
    }

    public DependencyResponse update(UUID id, DependencyRequest req) {
        Dependency dep = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dependencia no encontrada"));
        if (!dep.getCode().equalsIgnoreCase(req.getCode()) && repository.existsByCode(req.getCode())) {
            throw new IllegalArgumentException("Ya existe una dependencia con el código: " + req.getCode());
        }
        dep.setCode(req.getCode().trim().toUpperCase());
        dep.setName(req.getName().trim());
        dep.setActive(req.isActive());
        return toResponse(repository.save(dep));
    }

    public void delete(UUID id) {
        Dependency dep = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dependencia no encontrada"));
        dep.setActive(false);
        repository.save(dep);
    }

    private DependencyResponse toResponse(Dependency dep) {
        return DependencyResponse.builder()
                .id(dep.getId())
                .code(dep.getCode())
                .name(dep.getName())
                .active(dep.isActive())
                .build();
    }
}
