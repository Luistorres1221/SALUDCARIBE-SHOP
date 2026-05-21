package com.saludcaribe.shop.controller;

import com.saludcaribe.shop.dto.user.*;
import com.saludcaribe.shop.model.AppRole;
import com.saludcaribe.shop.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('admin')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(req));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable UUID id, @Valid @RequestBody UserRequest req) {
        return userService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/roles/{role}")
    public ResponseEntity<Void> assignRole(@PathVariable UUID id, @PathVariable AppRole role) {
        userService.assignRole(id, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/roles/{role}")
    public ResponseEntity<Void> removeRole(@PathVariable UUID id, @PathVariable AppRole role) {
        userService.removeRole(id, role);
        return ResponseEntity.noContent().build();
    }
}
