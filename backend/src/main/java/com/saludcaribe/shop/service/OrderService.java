package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.order.*;
import com.saludcaribe.shop.model.*;
import com.saludcaribe.shop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

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
                .build()).toList();

        Order order = Order.builder()
                .userId(userId)
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .total(total)
                .notes(req.getNotes())
                .status(OrderStatus.pendiente)
                .createdAt(LocalDateTime.now())
                .items(new java.util.ArrayList<>(items))
                .build();

        orderRepository.save(order);
        cartItems.forEach(item -> {
            Product product = productRepository.findById(item.getProductId()).orElseThrow();
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        });
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
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order o) {
        List<OrderResponse.OrderItemResponse> items = o.getItems().stream()
                .map(i -> OrderResponse.OrderItemResponse.builder()
                        .id(i.getId()).productId(i.getProductId())
                        .productName(i.getProductName()).unitPrice(i.getUnitPrice())
                        .quantity(i.getQuantity())
                        .subtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .build()).toList();

        return OrderResponse.builder()
                .id(o.getId())
                .userId(o.getUserId())
                .userFullName(o.getUserFullName())
                .userEmail(o.getUserEmail())
                .status(o.getStatus()).total(o.getTotal()).notes(o.getNotes())
                .createdAt(o.getCreatedAt()).paidAt(o.getPaidAt()).items(items)
                .build();
    }
}
