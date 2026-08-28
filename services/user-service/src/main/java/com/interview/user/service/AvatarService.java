package com.interview.user.service;

import com.interview.user.exception.ApiException;
import com.interview.user.exception.ErrorCode;
import com.interview.user.model.Profile;
import com.interview.user.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AvatarService {
    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final int EDGE = 512;
    private static final Pattern USER_ID = Pattern.compile("^[a-zA-Z0-9]{8,64}$");

    private final Path dir;
    private final ProfileRepository profiles;

    public AvatarService(
            @Value("${app.avatars-dir:./data/avatars}") String dir,
            ProfileRepository profiles
    ) {
        this.dir = Path.of(dir);
        this.profiles = profiles;
        try {
            Files.createDirectories(this.dir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create avatar directory", e);
        }
    }

    public Profile save(String userId, MultipartFile file) {
        String id = requireId(userId);
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Choose a photo", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Photo must be under 2 MB", HttpStatus.BAD_REQUEST);
        }
        BufferedImage source = readImage(file);
        writeJpeg(filePath(id), square(source));
        Instant now = Instant.now();
        Profile profile = profiles.findByUserId(id).orElseGet(() -> Profile.builder()
                .userId(id)
                .name("Candidate")
                .skills(List.of())
                .onboarded(false)
                .createdAt(now)
                .build());
        profile.setAvatar(publicUrl(id, now.toEpochMilli()));
        profile.setUpdatedAt(now);
        return profiles.save(profile);
    }

    public Profile clear(String userId) {
        String id = requireId(userId);
        deleteFile(id);
        Profile profile = profiles.findByUserId(id).orElse(null);
        if (profile == null) {
            return null;
        }
        profile.setAvatar(null);
        profile.setUpdatedAt(Instant.now());
        return profiles.save(profile);
    }

    public void deleteFile(String userId) {
        if (userId == null || !USER_ID.matcher(userId).matches()) {
            return;
        }
        try {
            Files.deleteIfExists(filePath(userId));
        } catch (IOException ignored) {
            // Wipe still proceeds if the file is already gone.
        }
    }

    public Optional<byte[]> read(String userId) {
        if (userId == null || !USER_ID.matcher(userId).matches()) {
            return Optional.empty();
        }
        Path file = filePath(userId);
        if (!Files.isRegularFile(file)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(file));
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    private BufferedImage readImage(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new ApiException(ErrorCode.VALIDATION_ERROR, "Use a JPG or PNG photo", HttpStatus.BAD_REQUEST);
            }
            if ((long) image.getWidth() * image.getHeight() > 20_000_000L) {
                throw new ApiException(ErrorCode.VALIDATION_ERROR, "Photo is too large", HttpStatus.BAD_REQUEST);
            }
            return image;
        } catch (ApiException e) {
            throw e;
        } catch (IOException e) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Could not read that photo", HttpStatus.BAD_REQUEST);
        }
    }

    private BufferedImage square(BufferedImage source) {
        int side = Math.min(source.getWidth(), source.getHeight());
        int sx = (source.getWidth() - side) / 2;
        int sy = (source.getHeight() - side) / 2;
        BufferedImage out = new BufferedImage(EDGE, EDGE, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, EDGE, EDGE);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(source, 0, 0, EDGE, EDGE, sx, sy, sx + side, sy + side, null);
        g.dispose();
        return out;
    }

    private void writeJpeg(Path target, BufferedImage image) {
        try {
            boolean wrote = ImageIO.write(image, "jpeg", target.toFile());
            if (!wrote) {
                wrote = ImageIO.write(image, "jpg", target.toFile());
            }
            if (!wrote) {
                throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "Could not save photo", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (ApiException e) {
            throw e;
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "Could not save photo", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Path filePath(String userId) {
        return dir.resolve(userId + ".jpg");
    }

    private String publicUrl(String userId, long version) {
        return "/api/v1/users/avatars/" + userId + "?v=" + version;
    }

    private String requireId(String userId) {
        if (userId == null || !USER_ID.matcher(userId).matches()) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Missing user", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
