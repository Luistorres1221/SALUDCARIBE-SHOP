package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.CartItem;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class CartItemRepository {

    private final Map<UUID, CartItem> store = new ConcurrentHashMap<>();

    @Value("${app.data.dir:./data}")
    private String dataDir;

    private Path dataFile() {
        return Path.of(dataDir, "cart-items.json");
    }

    @PostConstruct
    void load() {
        store.putAll(JsonFileStore.load(dataFile(), CartItem.class, CartItem::getId));
    }

    private void persist() {
        JsonFileStore.save(dataFile(), store.values());
    }

    public CartItem save(CartItem item) {
        if (item.getId() == null) {
            item.setId(UUID.randomUUID());
        }
        store.put(item.getId(), item);
        persist();
        return item;
    }

    public Optional<CartItem> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<CartItem> findByUserId(UUID userId) {
        return store.values().stream()
                .filter(i -> userId.equals(i.getUserId()))
                .collect(Collectors.toList());
    }

    public Optional<CartItem> findByUserIdAndProductId(UUID userId, UUID productId) {
        return store.values().stream()
                .filter(i -> userId.equals(i.getUserId()) && productId.equals(i.getProductId()))
                .findFirst();
    }

    public void deleteById(UUID id) {
        store.remove(id);
        persist();
    }

    public void deleteByUserId(UUID userId) {
        store.values().removeIf(i -> userId.equals(i.getUserId()));
        persist();
    }
}
