package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.internalorder.*;
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
public class InternalOrderService {

    private final InternalOrderRepository internalOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public List<InternalOrderResponse> findAll() {
        return internalOrderRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InternalOrderResponse> findByUser(UUID userId) {
        return internalOrderRepository.findByRequestedByOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InternalOrderResponse findById(UUID id) {
        return internalOrderRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Pedido interno no encontrado"));
    }

    @Transactional
    public InternalOrderResponse create(CreateInternalOrderRequest req, UUID userId, String userName, String userEmail) {
        Warehouse warehouse = warehouseRepository.findById(req.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Bodega no encontrada"));
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Debe incluir al menos un producto");
        }

        InternalOrder order = InternalOrder.builder()
                .warehouseId(warehouse.getId())
                .warehouseName(warehouse.getName())
                .areaName(req.getAreaName())
                .requestedBy(userId)
                .requestedByName(userName)
                .requestedByEmail(userEmail)
                .status(InternalOrderStatus.PENDIENTE)
                .notes(req.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        InternalOrder saved = internalOrderRepository.save(order);

        List<InternalOrderItem> items = req.getItems().stream().map(ir -> {
            Product p = productRepository.findById(ir.getProductId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            return InternalOrderItem.builder()
                    .internalOrder(saved)
                    .productId(p.getId())
                    .productName(p.getName())
                    .productSku(p.getSku())
                    .unitPrice(p.getPrice())
                    .requestedQuantity(ir.getRequestedQuantity())
                    .build();
        }).collect(Collectors.toList());

        saved.setItems(items);
        return toResponse(internalOrderRepository.save(saved));
    }

    @Transactional
    public InternalOrderResponse approve(UUID orderId, ApproveInternalOrderRequest req, UUID adminId, String adminName) {
        InternalOrder order = internalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        if (order.getStatus() != InternalOrderStatus.PENDIENTE) {
            throw new RuntimeException("Solo se pueden aprobar pedidos en estado PENDIENTE");
        }

        order.setStatus(InternalOrderStatus.APROBADO);
        order.setApprovedBy(adminId);
        order.setApprovedByName(adminName);
        order.setApprovedAt(LocalDateTime.now());
        order.setAdminNotes(req.getAdminNotes());

        if (req.getItems() != null && !req.getItems().isEmpty()) {
            Map<UUID, Integer> approvedMap = req.getItems().stream()
                    .collect(Collectors.toMap(ApproveInternalOrderItemRequest::getItemId,
                            ApproveInternalOrderItemRequest::getApprovedQuantity));
            order.getItems().forEach(item ->
                    item.setApprovedQuantity(approvedMap.getOrDefault(item.getId(), item.getRequestedQuantity())));
        } else {
            order.getItems().forEach(item -> item.setApprovedQuantity(item.getRequestedQuantity()));
        }

        return toResponse(internalOrderRepository.save(order));
    }

    @Transactional
    public InternalOrderResponse deliver(UUID orderId, DeliverInternalOrderRequest req, UUID adminId, String adminName) {
        InternalOrder order = internalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        if (order.getStatus() != InternalOrderStatus.APROBADO) {
            throw new RuntimeException("Solo se pueden entregar pedidos en estado APROBADO");
        }

        for (InternalOrderItem item : order.getItems()) {
            int qty = item.getApprovedQuantity() != null ? item.getApprovedQuantity() : item.getRequestedQuantity();
            if (qty > 0) {
                inventoryService.deductStock(
                        order.getWarehouseId(), item.getProductId(), qty,
                        MovementType.SALIDA_ENTREGA, order.getId(), "INTERNAL_ORDER",
                        "Entrega al área: " + order.getAreaName(), adminId, adminName
                );
                item.setDeliveredQuantity(qty);
            }
        }

        order.setStatus(InternalOrderStatus.ENTREGADO);
        order.setDeliveredBy(adminId);
        order.setDeliveredByName(adminName);
        order.setReceivedByName(req.getReceivedByName());
        order.setDeliveredAt(LocalDateTime.now());
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            String existing = order.getAdminNotes() != null ? order.getAdminNotes() + " | " : "";
            order.setAdminNotes(existing + req.getNotes());
        }

        return toResponse(internalOrderRepository.save(order));
    }

    @Transactional
    public InternalOrderResponse cancel(UUID orderId) {
        InternalOrder order = internalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        if (order.getStatus() == InternalOrderStatus.ENTREGADO) {
            throw new RuntimeException("No se puede cancelar un pedido ya entregado");
        }
        order.setStatus(InternalOrderStatus.CANCELADO);
        return toResponse(internalOrderRepository.save(order));
    }

    public InternalOrderResponse toResponse(InternalOrder o) {
        List<InternalOrderItemResponse> items = o.getItems() == null ? List.of() :
                o.getItems().stream().map(i -> InternalOrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .productSku(i.getProductSku())
                        .unitPrice(i.getUnitPrice())
                        .requestedQuantity(i.getRequestedQuantity())
                        .approvedQuantity(i.getApprovedQuantity())
                        .deliveredQuantity(i.getDeliveredQuantity())
                        .build()).collect(Collectors.toList());

        return InternalOrderResponse.builder()
                .id(o.getId())
                .warehouseId(o.getWarehouseId())
                .warehouseName(o.getWarehouseName())
                .areaName(o.getAreaName())
                .requestedBy(o.getRequestedBy())
                .requestedByName(o.getRequestedByName())
                .requestedByEmail(o.getRequestedByEmail())
                .approvedBy(o.getApprovedBy())
                .approvedByName(o.getApprovedByName())
                .deliveredBy(o.getDeliveredBy())
                .deliveredByName(o.getDeliveredByName())
                .receivedByName(o.getReceivedByName())
                .status(o.getStatus())
                .notes(o.getNotes())
                .adminNotes(o.getAdminNotes())
                .createdAt(o.getCreatedAt())
                .approvedAt(o.getApprovedAt())
                .deliveredAt(o.getDeliveredAt())
                .items(items)
                .build();
    }
}
