package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.transfer.*;
import com.saludcaribe.shop.model.User;
import com.saludcaribe.shop.repository.UserRepository;
import com.saludcaribe.shop.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;
    private final UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping("/admin/transfers")
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public ResponseEntity<List<TransferResponse>> getAll() {
        return ResponseEntity.ok(transferService.findAll());
    }

    @GetMapping("/admin/transfers/{id}")
    @PreAuthorize("hasAnyRole('admin','almacenista')")
    public ResponseEntity<TransferResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(transferService.findById(id));
    }

    @GetMapping("/transfers/mine")
    public ResponseEntity<List<TransferResponse>> getMine(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(transferService.findByUser(currentUser(ud).getId()));
    }

    @PostMapping("/transfers")
    public ResponseEntity<TransferResponse> create(
            @RequestBody CreateTransferRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(transferService.create(req, user.getId(), user.getFullName()));
    }

    @PostMapping("/admin/transfers/{id}/approve")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<TransferResponse> approve(
            @PathVariable UUID id,
            @RequestBody ApproveTransferRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(transferService.approve(id, req, user.getId(), user.getFullName()));
    }

    @PostMapping("/admin/transfers/{id}/reject")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<TransferResponse> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        String notes = body != null ? body.getOrDefault("adminNotes", "") : "";
        return ResponseEntity.ok(transferService.reject(id, notes, user.getId(), user.getFullName()));
    }

    @PostMapping("/admin/transfers/{id}/dispatch")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<TransferResponse> dispatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(transferService.dispatch(id, user.getId(), user.getFullName()));
    }

    @PostMapping("/transfers/{id}/receive")
    public ResponseEntity<TransferResponse> receive(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(transferService.receive(id, user.getId(), user.getFullName()));
    }
}
