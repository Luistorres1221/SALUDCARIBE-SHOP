package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Order;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class OrderRepository {

    private final Map<UUID, Order> store = new ConcurrentHashMap<>();

    @Value("${app.data.dir:./data}")
    private String dataDir;

    private Path dataFile() {
        return Path.of(dataDir, "orders.json");
    }

    @PostConstruct
    void load() {
        store.putAll(JsonFileStore.load(dataFile(), Order.class, Order::getId));
    }

    private void persist() {
        JsonFileStore.save(dataFile(), store.values());
    }

    public Order save(Order order) {
        if (order.getId() == null) {
            order.setId(UUID.randomUUID());
        }
        store.put(order.getId(), order);
        persist();
        return order;
    }

    public Optional<Order> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Order> findAll() {
        return store.values().stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public List<Order> findByUserId(UUID userId) {
        return store.values().stream()
                .filter(o -> userId.equals(o.getUserId()))
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public void deleteById(UUID id) {
        store.remove(id);
        persist();
    }
}
