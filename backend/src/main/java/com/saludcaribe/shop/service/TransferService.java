package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.transfer.*;
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
public class TransferService {

    private final TransferRequestRepository transferRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public List<TransferResponse> findAll() {
        return transferRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransferResponse> findByUser(UUID userId) {
        return transferRepository.findByRequestedByOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransferResponse findById(UUID id) {
        return transferRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Solicitud de traslado no encontrada"));
    }

    @Transactional
    public TransferResponse create(CreateTransferRequest req, UUID userId, String userName) {
        Warehouse from = warehouseRepository.findById(req.getFromWarehouseId())
                .orElseThrow(() -> new RuntimeException("Bodega origen no encontrada"));
        Warehouse to = warehouseRepository.findById(req.getToWarehouseId())
                .orElseThrow(() -> new RuntimeException("Bodega destino no encontrada"));
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Debe incluir al menos un producto");
        }

        TransferRequest transfer = TransferRequest.builder()
                .fromWarehouseId(from.getId())
                .fromWarehouseName(from.getName())
                .toWarehouseId(to.getId())
                .toWarehouseName(to.getName())
                .requestedBy(userId)
                .requestedByName(userName)
                .status(TransferStatus.PENDIENTE)
                .notes(req.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        TransferRequest saved = transferRepository.save(transfer);

        List<TransferRequestItem> items = req.getItems().stream().map(ir -> {
            Product p = productRepository.findById(ir.getProductId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + ir.getProductId()));
            return TransferRequestItem.builder()
                    .transferRequest(saved)
                    .productId(p.getId())
                    .productName(p.getName())
                    .productSku(p.getSku())
                    .requestedQuantity(ir.getRequestedQuantity())
                    .build();
        }).collect(Collectors.toList());

        saved.setItems(items);
        return toResponse(transferRepository.save(saved));
    }

    @Transactional
    public TransferResponse approve(UUID transferId, ApproveTransferRequest req, UUID adminId, String adminName) {
        TransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Traslado no encontrado"));
        if (transfer.getStatus() != TransferStatus.PENDIENTE) {
            throw new RuntimeException("Solo se pueden aprobar traslados en estado PENDIENTE");
        }

        transfer.setStatus(TransferStatus.APROBADO);
        transfer.setApprovedBy(adminId);
        transfer.setApprovedByName(adminName);
        transfer.setApprovedAt(LocalDateTime.now());
        transfer.setAdminNotes(req.getAdminNotes());

        if (req.getItems() != null && !req.getItems().isEmpty()) {
            Map<UUID, Integer> approvedMap = req.getItems().stream()
                    .collect(Collectors.toMap(ApproveTransferItemRequest::getItemId,
                            ApproveTransferItemRequest::getApprovedQuantity));
            transfer.getItems().forEach(item ->
                    item.setApprovedQuantity(approvedMap.getOrDefault(item.getId(), item.getRequestedQuantity())));
        } else {
            transfer.getItems().forEach(item -> item.setApprovedQuantity(item.getRequestedQuantity()));
        }

        return toResponse(transferRepository.save(transfer));
    }

    @Transactional
    public TransferResponse reject(UUID transferId, String adminNotes, UUID adminId, String adminName) {
        TransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Traslado no encontrado"));
        if (transfer.getStatus() != TransferStatus.PENDIENTE) {
            throw new RuntimeException("Solo se pueden rechazar traslados en estado PENDIENTE");
        }
        transfer.setStatus(TransferStatus.RECHAZADO);
        transfer.setApprovedBy(adminId);
        transfer.setApprovedByName(adminName);
        transfer.setApprovedAt(LocalDateTime.now());
        transfer.setAdminNotes(adminNotes);
        return toResponse(transferRepository.save(transfer));
    }

    @Transactional
    public TransferResponse dispatch(UUID transferId, UUID adminId, String adminName) {
        TransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Traslado no encontrado"));
        if (transfer.getStatus() != TransferStatus.APROBADO) {
            throw new RuntimeException("Solo se pueden despachar traslados en estado APROBADO");
        }

        for (TransferRequestItem item : transfer.getItems()) {
            int qty = item.getApprovedQuantity() != null ? item.getApprovedQuantity() : item.getRequestedQuantity();
            if (qty > 0) {
                inventoryService.deductStock(
                        transfer.getFromWarehouseId(), item.getProductId(), qty,
                        MovementType.TRASLADO_SALIDA, transfer.getId(), "TRANSFER",
                        "Traslado hacia: " + transfer.getToWarehouseName(), adminId, adminName
                );
                item.setDispatchedQuantity(qty);
            }
        }

        transfer.setStatus(TransferStatus.DESPACHADO);
        transfer.setDispatchedBy(adminId);
        transfer.setDispatchedByName(adminName);
        transfer.setDispatchedAt(LocalDateTime.now());
        return toResponse(transferRepository.save(transfer));
    }

    @Transactional
    public TransferResponse receive(UUID transferId, UUID userId, String userName) {
        TransferRequest transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new RuntimeException("Traslado no encontrado"));
        if (transfer.getStatus() != TransferStatus.DESPACHADO) {
            throw new RuntimeException("Solo se pueden recibir traslados en estado DESPACHADO");
        }

        for (TransferRequestItem item : transfer.getItems()) {
            int qty = item.getDispatchedQuantity() != null ? item.getDispatchedQuantity() : 0;
            if (qty > 0) {
                inventoryService.addStock(
                        transfer.getToWarehouseId(), item.getProductId(), qty,
                        MovementType.TRASLADO_ENTRADA, transfer.getId(), "TRANSFER",
                        "Recepción desde: " + transfer.getFromWarehouseName(), userId, userName
                );
                item.setReceivedQuantity(qty);
            }
        }

        transfer.setStatus(TransferStatus.RECIBIDO);
        transfer.setReceivedBy(userId);
        transfer.setReceivedByName(userName);
        transfer.setReceivedAt(LocalDateTime.now());
        return toResponse(transferRepository.save(transfer));
    }

    public TransferResponse toResponse(TransferRequest t) {
        List<TransferItemResponse> items = t.getItems() == null ? List.of() :
                t.getItems().stream().map(i -> TransferItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .productSku(i.getProductSku())
                        .requestedQuantity(i.getRequestedQuantity())
                        .approvedQuantity(i.getApprovedQuantity())
                        .dispatchedQuantity(i.getDispatchedQuantity())
                        .receivedQuantity(i.getReceivedQuantity())
                        .build()).collect(Collectors.toList());

        return TransferResponse.builder()
                .id(t.getId())
                .fromWarehouseId(t.getFromWarehouseId())
                .fromWarehouseName(t.getFromWarehouseName())
                .toWarehouseId(t.getToWarehouseId())
                .toWarehouseName(t.getToWarehouseName())
                .requestedBy(t.getRequestedBy())
                .requestedByName(t.getRequestedByName())
                .approvedBy(t.getApprovedBy())
                .approvedByName(t.getApprovedByName())
                .dispatchedBy(t.getDispatchedBy())
                .dispatchedByName(t.getDispatchedByName())
                .receivedBy(t.getReceivedBy())
                .receivedByName(t.getReceivedByName())
                .status(t.getStatus())
                .notes(t.getNotes())
                .adminNotes(t.getAdminNotes())
                .createdAt(t.getCreatedAt())
                .approvedAt(t.getApprovedAt())
                .dispatchedAt(t.getDispatchedAt())
                .receivedAt(t.getReceivedAt())
                .items(items)
                .build();
    }
}
