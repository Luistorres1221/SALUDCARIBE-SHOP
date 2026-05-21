package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.cart.*;
import com.saludcaribe.shop.model.User;
import com.saludcaribe.shop.repository.UserRepository;
import com.saludcaribe.shop.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    @GetMapping
    public List<CartItemResponse> getCart(@AuthenticationPrincipal UserDetails ud) {
        return cartService.getCart(resolveUserId(ud));
    }

    @PostMapping("/items")
    public ResponseEntity<CartItemResponse> addItem(
            @AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody CartItemRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartService.addItem(resolveUserId(ud), req));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartItemResponse> updateQty(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable UUID itemId,
            @RequestParam int quantity
    ) {
        CartItemResponse res = cartService.updateQty(resolveUserId(ud), itemId, quantity);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.noContent().build();
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable UUID itemId
    ) {
        cartService.removeItem(resolveUserId(ud), itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal UserDetails ud) {
        cartService.clearCart(resolveUserId(ud));
        return ResponseEntity.noContent().build();
    }

    private UUID resolveUserId(UserDetails ud) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));
        return user.getId();
    }
}
