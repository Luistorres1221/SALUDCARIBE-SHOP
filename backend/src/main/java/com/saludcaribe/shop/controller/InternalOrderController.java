package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.internalorder.*;
import com.saludcaribe.shop.model.User;
import com.saludcaribe.shop.repository.UserRepository;
import com.saludcaribe.shop.service.InternalOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InternalOrderController {

    private final InternalOrderService internalOrderService;
    private final UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping("/admin/internal-orders")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<List<InternalOrderResponse>> getAll() {
        return ResponseEntity.ok(internalOrderService.findAll());
    }

    @GetMapping("/admin/internal-orders/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<InternalOrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(internalOrderService.findById(id));
    }

    @GetMapping("/internal-orders/mine")
    public ResponseEntity<List<InternalOrderResponse>> getMine(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(internalOrderService.findByUser(currentUser(ud).getId()));
    }

    @PostMapping("/internal-orders")
    public ResponseEntity<InternalOrderResponse> create(
            @RequestBody CreateInternalOrderRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(internalOrderService.create(req, user.getId(), user.getFullName(), user.getEmail()));
    }

    @PostMapping("/admin/internal-orders/{id}/approve")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<InternalOrderResponse> approve(
            @PathVariable UUID id,
            @RequestBody ApproveInternalOrderRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(internalOrderService.approve(id, req, user.getId(), user.getFullName()));
    }

    @PostMapping("/admin/internal-orders/{id}/deliver")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<InternalOrderResponse> deliver(
            @PathVariable UUID id,
            @RequestBody DeliverInternalOrderRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(internalOrderService.deliver(id, req, user.getId(), user.getFullName()));
    }

    @PostMapping("/admin/internal-orders/{id}/cancel")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<InternalOrderResponse> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(internalOrderService.cancel(id));
    }
}
