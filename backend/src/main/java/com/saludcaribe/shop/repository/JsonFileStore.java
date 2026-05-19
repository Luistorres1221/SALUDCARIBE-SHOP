package com.saludcaribe.shop.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

final class JsonFileStore {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT);

    private JsonFileStore() {
    }

    static <T> Map<UUID, T> load(Path path, Class<T> type, IdExtractor<T> idExtractor) {
        if (!Files.exists(path)) {
            return new ConcurrentHashMap<>();
        }
        try {
            var collectionType = MAPPER.getTypeFactory().constructCollectionType(List.class, type);
            List<T> items = MAPPER.readValue(path.toFile(), collectionType);
            Map<UUID, T> result = new ConcurrentHashMap<>();
            for (T item : items) {
                UUID id = idExtractor.getId(item);
                if (id != null) {
                    result.put(id, item);
                }
            }
            return result;
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer el archivo de datos: " + path, e);
        }
    }

    static <T> void save(Path path, Collection<T> items) {
        try {
            Files.createDirectories(path.getParent());
            MAPPER.writeValue(path.toFile(), items);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar el archivo de datos: " + path, e);
        }
    }

    @FunctionalInterface
    interface IdExtractor<T> {
        UUID getId(T item);
    }
}
