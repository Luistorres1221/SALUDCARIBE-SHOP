package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.order.*;
import com.saludcaribe.shop.model.*;
import com.saludcaribe.shop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.saludcaribe.shop.repository.CostCenterRepository;
import com.saludcaribe.shop.repository.DependencyRepository;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderDeliveryRepository orderDeliveryRepository;
    private final CostCenterRepository costCenterRepository;
    private final DependencyRepository dependencyRepository;

    public List<OrderResponse> getMyOrders(UUID userId) {
        return orderRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    public OrderResponse findById(UUID id, UUID userId, boolean isAdmin) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
        if (!isAdmin && !userId.equals(order.getUserId())) {
            throw new IllegalArgumentException("No autorizado");
        }
        return toResponse(order);
    }

    public OrderResponse createFromCart(UUID userId, CreateOrderRequest req) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("El carrito está vacío");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        CostCenter costCenter = costCenterRepository.findById(req.getCostCenterId())
                .orElseThrow(() -> new IllegalArgumentException("Centro de costo no encontrado"));
        if (!costCenter.isActive()) {
            throw new IllegalArgumentException("El centro de costo seleccionado no está activo");
        }

        Dependency dependency = dependencyRepository.findById(req.getDependencyId())
                .orElseThrow(() -> new IllegalArgumentException("Dependencia no encontrada"));
        if (!dependency.isActive()) {
            throw new IllegalArgumentException("La dependencia seleccionada no está activa");
        }

        for (CartItem item : cartItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + item.getProductName()));
            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new IllegalArgumentException("Producto inactivo: " + product.getName());
            }
            if (product.getStock() == null || product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException("Stock insuficiente para " + product.getName());
            }
        }

        BigDecimal total = cartItems.stream()
                .map(i -> i.getProductPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<OrderItem> items = cartItems.stream().map(i -> OrderItem.builder()
                .id(UUID.randomUUID())
                .productId(i.getProductId())
                .productName(i.getProductName())
                .unitPrice(i.getProductPrice())
                .quantity(i.getQuantity())
                .deliveredQty(0)
                .build()).toList();

        Order order = Order.builder()
                .userId(userId)
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .userArea(user.getArea())
                .costCenterId(costCenter.getId())
                .costCenterName(costCenter.getName())
                .dependencyId(dependency.getId())
                .dependencyName(dependency.getName())
                .total(total)
                .notes(req.getNotes())
                .status(OrderStatus.pendiente)
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>(items))
                .build();

        orderRepository.save(order);
        cartItemRepository.deleteByUserId(userId);
        return toResponse(order);
    }

    public OrderResponse updateStatus(UUID id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
        order.setStatus(status);
        if (status == OrderStatus.pagado && order.getPaidAt() == null) {
            order.setPaidAt(LocalDateTime.now());
        }
        order.setUpdatedAt(LocalDateTime.now());
        return toResponse(orderRepository.save(order));
    }

    // RF-048 a RF-057: gestión de entregas parciales con historial
    public OrderResponse deliverItems(UUID orderId, DeliverOrderRequest req, String adminEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (order.getStatus() == OrderStatus.cancelado) {
            throw new IllegalArgumentException("No se puede entregar un pedido cancelado");
        }
        if (order.getStatus() == OrderStatus.entregado) {
            throw new IllegalArgumentException("El pedido ya fue completamente entregado");
        }

        List<OrderDeliveryItem> deliveryItems = new ArrayList<>();

        for (DeliverItemRequest dr : req.getItems()) {
            OrderItem item = order.getItems().stream()
                    .filter(i -> i.getId().equals(dr.getItemId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item no encontrado: " + dr.getItemId()));

            int currentDelivered = item.getDeliveredQty() != null ? item.getDeliveredQty() : 0;
            int newDelivered = currentDelivered + dr.getDeliveredQty();

            if (newDelivered > item.getQuantity()) {
                throw new IllegalArgumentException(
                        "La cantidad a entregar de '" + item.getProductName() + "' excede lo solicitado");
            }

            item.setDeliveredQty(newDelivered);

            if (dr.getDeliveredQty() > 0) {
                // Decrement inventory when physically delivered
                if (item.getProductId() != null) {
                    productRepository.findById(item.getProductId()).ifPresent(product -> {
                        product.setStock(Math.max(0, product.getStock() - dr.getDeliveredQty()));
                        productRepository.save(product);
                    });
                }
                deliveryItems.add(OrderDeliveryItem.builder()
                        .itemId(item.getId())
                        .productName(item.getProductName())
                        .quantityDelivered(dr.getDeliveredQty())
                        .build());
            }
        }

        // RF-056: registrar historial de esta entrega
        if (!deliveryItems.isEmpty()) {
            OrderDelivery delivery = OrderDelivery.builder()
                    .orderId(orderId)
                    .deliveredAt(LocalDateTime.now())
                    .adminEmail(adminEmail)
                    .notes(req.getNotes())
                    .items(deliveryItems)
                    .build();
            orderDeliveryRepository.save(delivery);
        }

        // RF-052 y RF-053: cambio de estado automático
        boolean allDelivered = order.getItems().stream()
                .allMatch(i -> i.getDeliveredQty() != null && i.getDeliveredQty().equals(i.getQuantity()));
        boolean anyDelivered = order.getItems().stream()
                .anyMatch(i -> i.getDeliveredQty() != null && i.getDeliveredQty() > 0);

        if (allDelivered) {
            order.setStatus(OrderStatus.entregado);  // RF-052, RF-055
        } else if (anyDelivered) {
            order.setStatus(OrderStatus.parcial);    // RF-053
        }

        order.setUpdatedAt(LocalDateTime.now());
        return toResponse(orderRepository.save(order));
    }

    // RF-059: cancelación de pedidos con restauración de stock no entregado
    public OrderResponse cancelOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (order.getStatus() == OrderStatus.cancelado) {
            throw new IllegalArgumentException("El pedido ya está cancelado");
        }
        if (order.getStatus() == OrderStatus.entregado) {
            throw new IllegalArgumentException("No se puede cancelar un pedido ya entregado");
        }

        order.setStatus(OrderStatus.cancelado);
        order.setUpdatedAt(LocalDateTime.now());
        return toResponse(orderRepository.save(order));
    }

    // RF-060: observaciones del administrador
    public OrderResponse updateAdminNotes(UUID orderId, String adminNotes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
        order.setAdminNotes(adminNotes);
        order.setUpdatedAt(LocalDateTime.now());
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order o) {
        List<OrderResponse.OrderItemResponse> items = o.getItems().stream()
                .map(i -> {
                    int delivered = i.getDeliveredQty() != null ? i.getDeliveredQty() : 0;
                    return OrderResponse.OrderItemResponse.builder()
                            .id(i.getId())
                            .productId(i.getProductId())
                            .productName(i.getProductName())
                            .unitPrice(i.getUnitPrice())
                            .quantity(i.getQuantity())
                            .deliveredQty(delivered)
                            .pendingQty(i.getQuantity() - delivered)
                            .subtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                            .build();
                }).toList();

        List<DeliveryRecordResponse> deliveries = orderDeliveryRepository.findByOrderId(o.getId())
                .stream().map(d -> DeliveryRecordResponse.builder()
                        .id(d.getId())
                        .deliveredAt(d.getDeliveredAt())
                        .adminEmail(d.getAdminEmail())
                        .notes(d.getNotes())
                        .items(d.getItems().stream()
                                .map(di -> DeliveryRecordResponse.DeliveryItemResponse.builder()
                                        .itemId(di.getItemId())
                                        .productName(di.getProductName())
                                        .quantityDelivered(di.getQuantityDelivered())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(o.getId())
                .userId(o.getUserId())
                .userFullName(o.getUserFullName())
                .userEmail(o.getUserEmail())
                .userArea(o.getUserArea())
                .costCenterId(o.getCostCenterId())
                .costCenterName(o.getCostCenterName())
                .dependencyId(o.getDependencyId())
                .dependencyName(o.getDependencyName())
                .status(o.getStatus())
                .total(o.getTotal())
                .notes(o.getNotes())
                .adminNotes(o.getAdminNotes())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .paidAt(o.getPaidAt())
                .items(items)
                .deliveries(deliveries)
                .build();
    }
}
