package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.warehouse.WarehouseRequest;
import com.saludcaribe.shop.dto.warehouse.WarehouseResponse;
import com.saludcaribe.shop.model.Warehouse;
import com.saludcaribe.shop.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public List<WarehouseResponse> findAll() {
        return warehouseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<WarehouseResponse> findAllActive() {
        return warehouseRepository.findByActiveTrueOrderByTypeAscNameAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WarehouseResponse findById(UUID id) {
        return warehouseRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));
    }

    public WarehouseResponse create(WarehouseRequest req) {
        if (warehouseRepository.existsByCode(req.getCode())) {
            throw new RuntimeException("Ya existe una bodega con ese código");
        }
        Warehouse w = Warehouse.builder()
                .code(req.getCode().toUpperCase().trim())
                .name(req.getName())
                .location(req.getLocation())
                .description(req.getDescription())
                .type(req.getType())
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
        return toResponse(warehouseRepository.save(w));
    }

    public WarehouseResponse update(UUID id, WarehouseRequest req) {
        Warehouse w = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));
        w.setName(req.getName());
        w.setLocation(req.getLocation());
        w.setDescription(req.getDescription());
        w.setType(req.getType());
        if (req.getActive() != null) w.setActive(req.getActive());
        return toResponse(warehouseRepository.save(w));
    }

    public WarehouseResponse toResponse(Warehouse w) {
        return WarehouseResponse.builder()
                .id(w.getId())
                .code(w.getCode())
                .name(w.getName())
                .location(w.getLocation())
                .description(w.getDescription())
                .type(w.getType())
                .active(w.getActive())
                .createdAt(w.getCreatedAt())
                .build();
    }
}
