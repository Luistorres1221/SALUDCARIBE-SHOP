package com.saludcaribe.shop.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final Cloudinary cloudinary;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten archivos de imagen"));
        }

        @SuppressWarnings("rawtypes")
        Map result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", "saludcaribe")
        );

        String url = (String) result.get("secure_url");
        log.info("Imagen subida a Cloudinary: {}", url);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
