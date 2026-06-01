package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.cargo.CargoRequest;
import com.saludcaribe.shop.dto.cargo.CargoResponse;
import com.saludcaribe.shop.model.Cargo;
import com.saludcaribe.shop.repository.CargoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CargoService {

    private final CargoRepository cargoRepository;

    public List<CargoResponse> findAll() {
        return cargoRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse).toList();
    }

    public List<CargoResponse> findActive() {
        return cargoRepository.findByActiveTrue().stream()
                .map(this::toResponse).toList();
    }

    public CargoResponse findById(UUID id) {
        return toResponse(cargoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cargo no encontrado")));
    }

    public CargoResponse create(CargoRequest req) {
        Cargo cargo = Cargo.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .active(req.getActive() == null || req.getActive())
                .createdAt(LocalDateTime.now())
                .build();
        return toResponse(cargoRepository.save(cargo));
    }

    public CargoResponse update(UUID id, CargoRequest req) {
        Cargo cargo = cargoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cargo no encontrado"));
        cargo.setName(req.getName().trim());
        cargo.setDescription(req.getDescription());
        if (req.getActive() != null) {
            cargo.setActive(req.getActive());
        }
        return toResponse(cargoRepository.save(cargo));
    }

    public CargoResponse toggleActive(UUID id) {
        Cargo cargo = cargoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cargo no encontrado"));
        cargo.setActive(!cargo.isActive());
        return toResponse(cargoRepository.save(cargo));
    }

    public void delete(UUID id) {
        if (!cargoRepository.existsById(id)) {
            throw new IllegalArgumentException("Cargo no encontrado");
        }
        cargoRepository.deleteById(id);
    }

    public CargoResponse toResponse(Cargo c) {
        return CargoResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
