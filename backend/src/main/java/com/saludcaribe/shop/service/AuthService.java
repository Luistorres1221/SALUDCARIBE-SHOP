package com.saludcaribe.shop.service;

import com.saludcaribe.shop.dto.auth.*;
import com.saludcaribe.shop.model.User;
import com.saludcaribe.shop.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import com.saludcaribe.shop.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthResponse register(RegisterRequest req) {
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
        userRepository.save(user);
        return buildResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        User user = userRepository.findByEmail(req.getEmail()).orElseThrow();
        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        var ud = userDetailsService.loadUserByUsername(user.getEmail());
        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(ud))
                .refreshToken(jwtService.generateRefreshToken(ud))
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .area(user.getArea())
                .roles(user.getRoles())
                .build();
    }
}
