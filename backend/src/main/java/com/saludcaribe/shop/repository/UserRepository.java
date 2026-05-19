package com.saludcaribe.shop.repository;

import com.saludcaribe.shop.model.User;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class UserRepository {

    private final Map<UUID, User> store = new ConcurrentHashMap<>();

    @Value("${app.data.dir:./data}")
    private String dataDir;

    private Path dataFile() {
        return Path.of(dataDir, "users.json");
    }

    @PostConstruct
    void load() {
        store.putAll(JsonFileStore.load(dataFile(), User.class, User::getId));
    }

    private void persist() {
        JsonFileStore.save(dataFile(), store.values());
    }

    public User save(User user) {
        if (user.getId() == null) {
            user.setId(UUID.randomUUID());
        }
        store.put(user.getId(), user);
        persist();
        return user;
    }

    public Optional<User> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<User> findByEmail(String email) {
        return store.values().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst();
    }

    public boolean existsByEmail(String email) {
        return store.values().stream()
                .anyMatch(u -> u.getEmail().equalsIgnoreCase(email));
    }

    public void deleteById(UUID id) {
        store.remove(id);
        persist();
    }
}
