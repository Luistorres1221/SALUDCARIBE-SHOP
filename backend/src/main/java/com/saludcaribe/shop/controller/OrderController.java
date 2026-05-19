package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.order.*;
import com.saludcaribe.shop.model.OrderStatus;
import com.saludcaribe.shop.model.User;
import com.saludcaribe.shop.repository.UserRepository;
import com.saludcaribe.shop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/mine")
    public List<OrderResponse> getMyOrders(@AuthenticationPrincipal UserDetails ud) {
        return orderService.getMyOrders(resolveUserId(ud));
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public OrderResponse findById(@AuthenticationPrincipal UserDetails ud, @PathVariable UUID id) {
        boolean isAdmin = ud.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_admin"));
        return orderService.findById(id, resolveUserId(ud), isAdmin);
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody CreateOrderRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createFromCart(resolveUserId(ud), req));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('admin')")
    public OrderResponse updateStatus(@PathVariable UUID id, @RequestParam OrderStatus status) {
        return orderService.updateStatus(id, status);
    }

    private UUID resolveUserId(UserDetails ud) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));
        return user.getId();
    }
}
