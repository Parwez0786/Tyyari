package com.interview.user.controller;

import com.interview.user.service.AvatarService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.concurrent.TimeUnit;

@Controller
@RequestMapping("/api/v1/users/avatars")
public class AvatarController {

    private final AvatarService avatars;

    public AvatarController(AvatarService avatars) {
        this.avatars = avatars;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<byte[]> get(@PathVariable String userId) {
        return avatars.read(userId)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .body(bytes))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
