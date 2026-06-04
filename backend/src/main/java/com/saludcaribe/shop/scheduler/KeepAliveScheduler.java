package com.saludcaribe.shop.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
public class KeepAliveScheduler {

    @Value("${app.base-url:https://saludcaribe-backend.onrender.com}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Self-ping every 5 minutes to prevent Render free-tier from suspending the container.
    @Scheduled(fixedRate = 300_000)
    public void selfPing() {
        try {
            restTemplate.getForObject(baseUrl + "/api/ping", String.class);
        } catch (Exception e) {
            log.warn("Keep-alive self-ping failed: {}", e.getMessage());
        }
    }
}
