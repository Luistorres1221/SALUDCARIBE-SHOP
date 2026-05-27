package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.costcenter.CostCenterRequest;
import com.saludcaribe.shop.dto.costcenter.CostCenterResponse;
import com.saludcaribe.shop.model.CostCenter;
import com.saludcaribe.shop.repository.CostCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CostCenterService {

    private final CostCenterRepository repository;

    public List<CostCenterResponse> findAllActive() {
        return repository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public List<CostCenterResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public CostCenterResponse create(CostCenterRequest req) {
        if (repository.existsByCode(req.getCode())) {
            throw new IllegalArgumentException("Ya existe un centro de costo con el código: " + req.getCode());
        }
        CostCenter cc = CostCenter.builder()
                .code(req.getCode().trim().toUpperCase())
                .name(req.getName().trim())
                .budget(req.getBudget())
                .active(req.isActive())
                .build();
        return toResponse(repository.save(cc));
    }

    public CostCenterResponse update(UUID id, CostCenterRequest req) {
        CostCenter cc = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Centro de costo no encontrado"));
        if (!cc.getCode().equalsIgnoreCase(req.getCode()) && repository.existsByCode(req.getCode())) {
            throw new IllegalArgumentException("Ya existe un centro de costo con el código: " + req.getCode());
        }
        cc.setCode(req.getCode().trim().toUpperCase());
        cc.setName(req.getName().trim());
        cc.setBudget(req.getBudget());
        cc.setActive(req.isActive());
        return toResponse(repository.save(cc));
    }

    public void delete(UUID id) {
        CostCenter cc = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Centro de costo no encontrado"));
        cc.setActive(false);
        repository.save(cc);
    }

    private CostCenterResponse toResponse(CostCenter cc) {
        return CostCenterResponse.builder()
                .id(cc.getId())
                .code(cc.getCode())
                .name(cc.getName())
                .budget(cc.getBudget())
                .active(cc.isActive())
                .build();
    }
}
