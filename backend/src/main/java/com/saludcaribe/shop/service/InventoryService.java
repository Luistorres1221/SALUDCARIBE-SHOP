package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.inventory.*;
import com.saludcaribe.shop.model.*;
import com.saludcaribe.shop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final WarehouseStockRepository stockRepository;
    private final InventoryMovementRepository movementRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;

    public List<WarehouseStockResponse> getStockByWarehouse(UUID warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));
        Map<UUID, Product> productMap = productRepository.findAll()
                .stream().collect(Collectors.toMap(Product::getId, p -> p));
        return stockRepository.findByWarehouseId(warehouseId).stream()
                .map(s -> buildStockResponse(s, warehouse, productMap.get(s.getProductId())))
                .collect(Collectors.toList());
    }

    public List<WarehouseStockResponse> getAllStock() {
        Map<UUID, Warehouse> warehouseMap = warehouseRepository.findAll()
                .stream().collect(Collectors.toMap(Warehouse::getId, w -> w));
        Map<UUID, Product> productMap = productRepository.findAll()
                .stream().collect(Collectors.toMap(Product::getId, p -> p));
        return stockRepository.findAll().stream()
                .map(s -> buildStockResponse(s, warehouseMap.get(s.getWarehouseId()), productMap.get(s.getProductId())))
                .collect(Collectors.toList());
    }

    public List<WarehouseStockResponse> getLowStock(UUID warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElse(null);
        Map<UUID, Product> productMap = productRepository.findAll()
                .stream().collect(Collectors.toMap(Product::getId, p -> p));
        return stockRepository.findLowStockByWarehouse(warehouseId).stream()
                .map(s -> buildStockResponse(s, warehouse, productMap.get(s.getProductId())))
                .collect(Collectors.toList());
    }

    public List<WarehouseStockResponse> getOutOfStock(UUID warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId).orElse(null);
        Map<UUID, Product> productMap = productRepository.findAll()
                .stream().collect(Collectors.toMap(Product::getId, p -> p));
        return stockRepository.findOutOfStockByWarehouse(warehouseId).stream()
                .map(s -> buildStockResponse(s, warehouse, productMap.get(s.getProductId())))
                .collect(Collectors.toList());
    }

    private WarehouseStockResponse buildStockResponse(WarehouseStock s, Warehouse warehouse, Product product) {
        return WarehouseStockResponse.builder()
                .id(s.getId())
                .warehouseId(s.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : "—")
                .productId(s.getProductId())
                .productName(product != null ? product.getName() : "—")
                .productSku(product != null ? product.getSku() : "—")
                .productPrice(product != null ? product.getPrice() : null)
                .quantity(s.getQuantity())
                .minimumStock(s.getMinimumStock())
                .lowStock(s.getQuantity() > 0 && s.getMinimumStock() > 0 && s.getQuantity() <= s.getMinimumStock())
                .outOfStock(s.getQuantity() == 0)
                .build();
    }

    public WarehouseStock getOrCreateStock(UUID warehouseId, UUID productId) {
        return stockRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> stockRepository.save(WarehouseStock.builder()
                        .warehouseId(warehouseId)
                        .productId(productId)
                        .quantity(0)
                        .minimumStock(0)
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    @Transactional
    public InventoryMovementResponse recordEntry(StockEntryRequest req, UUID userId, String userName) {
        WarehouseStock stock = getOrCreateStock(req.getWarehouseId(), req.getProductId());
        int prev = stock.getQuantity();
        stock.setQuantity(prev + req.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        InventoryMovement movement = InventoryMovement.builder()
                .warehouseId(req.getWarehouseId())
                .productId(req.getProductId())
                .type(MovementType.ENTRADA_COMPRA)
                .quantity(req.getQuantity())
                .previousStock(prev)
                .newStock(stock.getQuantity())
                .notes(req.getNotes())
                .createdBy(userId)
                .createdByName(userName)
                .createdAt(LocalDateTime.now())
                .build();
        return toMovementResponse(movementRepository.save(movement));
    }

    @Transactional
    public InventoryMovementResponse adjustStock(AdjustStockRequest req, UUID userId, String userName) {
        WarehouseStock stock = getOrCreateStock(req.getWarehouseId(), req.getProductId());
        int prev = stock.getQuantity();
        int newQty;

        if (req.getType() == MovementType.AJUSTE_NEGATIVO) {
            if (prev < req.getQuantity()) {
                throw new RuntimeException("Stock insuficiente. Disponible: " + prev);
            }
            newQty = prev - req.getQuantity();
        } else {
            newQty = prev + req.getQuantity();
        }

        stock.setQuantity(newQty);
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        InventoryMovement movement = InventoryMovement.builder()
                .warehouseId(req.getWarehouseId())
                .productId(req.getProductId())
                .type(req.getType())
                .quantity(req.getQuantity())
                .previousStock(prev)
                .newStock(newQty)
                .notes(req.getNotes())
                .createdBy(userId)
                .createdByName(userName)
                .createdAt(LocalDateTime.now())
                .build();
        return toMovementResponse(movementRepository.save(movement));
    }

    public List<InventoryMovementResponse> getKardex(UUID productId, UUID warehouseId) {
        List<InventoryMovement> movements = warehouseId != null
                ? movementRepository.findByWarehouseIdAndProductIdOrderByCreatedAtDesc(warehouseId, productId)
                : movementRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return toMovementResponseList(movements);
    }

    public List<InventoryMovementResponse> getMovementsByWarehouse(UUID warehouseId) {
        return toMovementResponseList(movementRepository.findByWarehouseIdOrderByCreatedAtDesc(warehouseId));
    }

    public List<InventoryMovementResponse> getAllMovements() {
        return toMovementResponseList(movementRepository.findAll().stream()
                .sorted(Comparator.comparing(InventoryMovement::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList()));
    }

    private List<InventoryMovementResponse> toMovementResponseList(List<InventoryMovement> movements) {
        if (movements.isEmpty()) return List.of();
        Map<UUID, Warehouse> wMap = warehouseRepository.findAll()
                .stream().collect(Collectors.toMap(Warehouse::getId, w -> w));
        Map<UUID, Product> pMap = productRepository.findAll()
                .stream().collect(Collectors.toMap(Product::getId, p -> p));
        return movements.stream()
                .map(m -> toMovementResponseWithMaps(m, wMap, pMap))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deductStock(UUID warehouseId, UUID productId, int qty, MovementType type,
                            UUID referenceId, String referenceType, String notes, UUID userId, String userName) {
        WarehouseStock stock = stockRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseThrow(() -> new RuntimeException("No hay stock para el producto en la bodega seleccionada"));
        if (stock.getQuantity() < qty) {
            Product p = productRepository.findById(productId).orElse(null);
            throw new RuntimeException("Stock insuficiente para: " + (p != null ? p.getName() : productId)
                    + ". Disponible: " + stock.getQuantity());
        }
        int prev = stock.getQuantity();
        stock.setQuantity(prev - qty);
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        movementRepository.save(InventoryMovement.builder()
                .warehouseId(warehouseId).productId(productId)
                .type(type).quantity(qty)
                .previousStock(prev).newStock(stock.getQuantity())
                .referenceId(referenceId).referenceType(referenceType)
                .notes(notes)
                .createdBy(userId).createdByName(userName)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void addStock(UUID warehouseId, UUID productId, int qty, MovementType type,
                         UUID referenceId, String referenceType, String notes, UUID userId, String userName) {
        WarehouseStock stock = getOrCreateStock(warehouseId, productId);
        int prev = stock.getQuantity();
        stock.setQuantity(prev + qty);
        stock.setUpdatedAt(LocalDateTime.now());
        stockRepository.save(stock);

        movementRepository.save(InventoryMovement.builder()
                .warehouseId(warehouseId).productId(productId)
                .type(type).quantity(qty)
                .previousStock(prev).newStock(stock.getQuantity())
                .referenceId(referenceId).referenceType(referenceType)
                .notes(notes)
                .createdBy(userId).createdByName(userName)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public InventoryMovementResponse toMovementResponse(InventoryMovement m) {
        Warehouse w = m.getWarehouseId() != null ? warehouseRepository.findById(m.getWarehouseId()).orElse(null) : null;
        Product p = m.getProductId() != null ? productRepository.findById(m.getProductId()).orElse(null) : null;
        return buildMovementResponse(m, w, p);
    }

    private InventoryMovementResponse toMovementResponseWithMaps(InventoryMovement m,
                                                                  Map<UUID, Warehouse> wMap,
                                                                  Map<UUID, Product> pMap) {
        return buildMovementResponse(m, wMap.get(m.getWarehouseId()), pMap.get(m.getProductId()));
    }

    private InventoryMovementResponse buildMovementResponse(InventoryMovement m, Warehouse w, Product p) {
        return InventoryMovementResponse.builder()
                .id(m.getId())
                .warehouseId(m.getWarehouseId())
                .warehouseName(w != null ? w.getName() : "—")
                .productId(m.getProductId())
                .productName(p != null ? p.getName() : "—")
                .productSku(p != null ? p.getSku() : "—")
                .type(m.getType())
                .typeLabel(getTypeLabel(m.getType()))
                .quantity(m.getQuantity())
                .previousStock(m.getPreviousStock())
                .newStock(m.getNewStock())
                .referenceId(m.getReferenceId())
                .referenceType(m.getReferenceType())
                .notes(m.getNotes())
                .createdBy(m.getCreatedBy())
                .createdByName(m.getCreatedByName())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private String getTypeLabel(MovementType type) {
        return switch (type) {
            case ENTRADA_COMPRA  -> "Entrada por Compra";
            case SALIDA_ENTREGA  -> "Salida por Entrega";
            case TRASLADO_SALIDA -> "Traslado Salida";
            case TRASLADO_ENTRADA-> "Traslado Entrada";
            case AJUSTE_POSITIVO -> "Ajuste Positivo";
            case AJUSTE_NEGATIVO -> "Ajuste Negativo";
            case DEVOLUCION      -> "Devolución";
        };
    }
}
