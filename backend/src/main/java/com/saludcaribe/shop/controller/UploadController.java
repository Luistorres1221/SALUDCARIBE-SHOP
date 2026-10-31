package com.saludcaribe.shop.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@Slf4j
public class UploadController {

    private static final Map<String, String> IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif",
            "image/bmp", "bmp"
    );

    private final Path uploadDirectory;

    public UploadController(@Value("$" + "{app.upload.dir:uploads}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo esta vacio"));
        }

        String contentType = file.getContentType();
        String extension = IMAGE_EXTENSIONS.get(contentType);
        if (extension == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Formato no permitido. Usa JPG, PNG, WEBP, GIF o BMP"
            ));
        }

        Files.createDirectories(uploadDirectory);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = uploadDirectory.resolve(filename).normalize();
        if (!destination.startsWith(uploadDirectory)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre de archivo no valido"));
        }

        file.transferTo(destination);
        String url = "/api/uploads/" + filename;
        log.info("Imagen guardada localmente: {}", destination);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) throws IOException {
        if (!filename.matches("[a-f0-9-]{36}\\.(jpg|png|webp|gif|bmp)")) {
            return ResponseEntity.notFound().build();
        }

        Path imagePath = uploadDirectory.resolve(filename).normalize();
        if (!imagePath.startsWith(uploadDirectory) || !Files.isRegularFile(imagePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource image = new UrlResource(imagePath.toUri());
        if (!image.exists() || !image.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = MediaTypeFactory.getMediaType(image)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.noCache())
                .body(image);
    }
}
