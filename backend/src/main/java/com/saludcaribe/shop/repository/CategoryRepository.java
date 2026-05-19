package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.Category;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class CategoryRepository {

    private final Map<UUID, Category> store = new ConcurrentHashMap<>();

    @Value("${app.data.dir:./data}")
    private String dataDir;

    private Path dataFile() {
        return Path.of(dataDir, "categories.json");
    }

    @PostConstruct
    void load() {
        store.putAll(JsonFileStore.load(dataFile(), Category.class, Category::getId));
    }

    private void persist() {
        JsonFileStore.save(dataFile(), store.values());
    }

    public Category save(Category category) {
        if (category.getId() == null) {
            category.setId(UUID.randomUUID());
        }
        store.put(category.getId(), category);
        persist();
        return category;
    }

    public Optional<Category> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Category> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<Category> findBySlug(String slug) {
        return store.values().stream()
                .filter(c -> c.getSlug().equals(slug))
                .findFirst();
    }

    public boolean existsBySlug(String slug) {
        return store.values().stream().anyMatch(c -> c.getSlug().equals(slug));
    }

    public void deleteById(UUID id) {
        store.remove(id);
        persist();
    }
}
