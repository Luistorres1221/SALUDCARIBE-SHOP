package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Product;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class ProductRepository {

    private final Map<UUID, Product> store = new ConcurrentHashMap<>();

    @Value("${app.data.dir:./data}")
    private String dataDir;

    private Path dataFile() {
        return Path.of(dataDir, "products.json");
    }

    @PostConstruct
    void load() {
        store.putAll(JsonFileStore.load(dataFile(), Product.class, Product::getId));
    }

    private void persist() {
        JsonFileStore.save(dataFile(), store.values());
    }

    public Product save(Product product) {
        if (product.getId() == null) {
            product.setId(UUID.randomUUID());
        }
        store.put(product.getId(), product);
        persist();
        return product;
    }

    public Optional<Product> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Product> findAll() {
        return store.values().stream()
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public List<Product> findByActiveTrue() {
        return store.values().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public List<Product> findByCategoryIdAndActiveTrue(UUID categoryId) {
        return store.values().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && categoryId.equals(p.getCategoryId()))
                .collect(Collectors.toList());
    }

    public List<Product> search(String q) {
        String lower = q.toLowerCase();
        return store.values().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getName().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }

    public boolean existsBySku(String sku) {
        return store.values().stream().anyMatch(p -> p.getSku().equals(sku));
    }

    public void deleteById(UUID id) {
        store.remove(id);
        persist();
    }
}
