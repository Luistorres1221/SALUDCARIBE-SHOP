package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.cart.*;
import com.saludcaribe.shop.model.CartItem;
import com.saludcaribe.shop.model.Product;
import com.saludcaribe.shop.repository.CartItemRepository;
import com.saludcaribe.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public List<CartItemResponse> getCart(UUID userId) {
        return cartItemRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public CartItemResponse addItem(UUID userId, CartItemRequest req) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, req.getProductId())
                .orElse(CartItem.builder()
                        .userId(userId)
                        .productId(product.getId())
                        .productName(product.getName())
                        .productSku(product.getSku())
                        .productPrice(product.getPrice())
                        .productImageUrl(product.getImageUrl())
                        .productStock(product.getStock())
                        .quantity(0)
                        .build());

        item.setQuantity(item.getQuantity() + req.getQuantity());
        item.setProductName(product.getName());
        item.setProductPrice(product.getPrice());
        item.setProductStock(product.getStock());
        return toResponse(cartItemRepository.save(item));
    }

    public CartItemResponse updateQty(UUID userId, UUID itemId, int quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        if (!userId.equals(item.getUserId())) {
            throw new IllegalArgumentException("No autorizado");
        }
        if (quantity <= 0) {
            cartItemRepository.deleteById(itemId);
            return null;
        }
        item.setQuantity(quantity);
        return toResponse(cartItemRepository.save(item));
    }

    public void removeItem(UUID userId, UUID itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item no encontrado"));
        if (!userId.equals(item.getUserId())) {
            throw new IllegalArgumentException("No autorizado");
        }
        cartItemRepository.deleteById(itemId);
    }

    public void clearCart(UUID userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    private CartItemResponse toResponse(CartItem i) {
        BigDecimal subtotal = i.getProductPrice().multiply(BigDecimal.valueOf(i.getQuantity()));
        return CartItemResponse.builder()
                .id(i.getId())
                .productId(i.getProductId())
                .productName(i.getProductName())
                .productSku(i.getProductSku())
                .productPrice(i.getProductPrice())
                .productImageUrl(i.getProductImageUrl())
                .productStock(i.getProductStock())
                .quantity(i.getQuantity())
                .subtotal(subtotal)
                .build();
    }
}
