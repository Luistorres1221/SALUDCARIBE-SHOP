package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.user.*;
import com.saludcaribe.shop.model.*;
import com.saludcaribe.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public UserResponse findById(UUID id) {
        return toResponse(userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado")));
    }

    public UserResponse create(UserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .area(req.getArea())
                .createdAt(LocalDateTime.now())
                .roles(new ArrayList<>())
                .build();
        return toResponse(userRepository.save(user));
    }

    public UserResponse update(UUID id, UserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        user.setEmail(req.getEmail());
        user.setFullName(req.getFullName());
        user.setArea(req.getArea());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        return toResponse(userRepository.save(user));
    }

    public void delete(UUID id) {
        userRepository.deleteById(id);
    }

    public void assignRole(UUID userId, AppRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (user.getRoles() == null) {
            user.setRoles(new ArrayList<>());
        }
        if (!user.getRoles().contains(role)) {
            user.getRoles().add(role);
            userRepository.save(user);
        }
    }

    public void removeRole(UUID userId, AppRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (user.getRoles() != null) {
            user.getRoles().remove(role);
            userRepository.save(user);
        }
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId()).email(u.getEmail()).fullName(u.getFullName())
                .area(u.getArea()).createdAt(u.getCreatedAt())
                .roles(u.getRoles())
                .build();
    }
}
