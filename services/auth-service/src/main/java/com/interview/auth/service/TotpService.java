package com.interview.auth.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Locale;

@Service
public class TotpService {
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    public String newSecret() {
        byte[] raw = new byte[20];
        RANDOM.nextBytes(raw);
        return base32(raw);
    }

    public String otpauthUrl(String email, String secret) {
        String label = "Tyyari:" + (email == null ? "staff" : email.trim());
        return "otpauth://totp/" + encode(label)
                + "?secret=" + secret
                + "&issuer=Tyyari&algorithm=SHA1&digits=6&period=30";
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        String digits = code.replaceAll("\\s+", "");
        if (!digits.matches("\\d{6}")) {
            return false;
        }
        long step = System.currentTimeMillis() / 30_000L;
        for (int i = -1; i <= 1; i++) {
            if (digits.equals(hotp(secret, step + i))) {
                return true;
            }
        }
        return false;
    }

    private String hotp(String secret, long counter) {
        try {
            byte[] key = fromBase32(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            return String.format(Locale.ROOT, "%06d", binary % 1_000_000);
        } catch (Exception e) {
            return "";
        }
    }

    private static String base32(byte[] data) {
        StringBuilder out = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                out.append(ALPHABET.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) {
            out.append(ALPHABET.charAt((buffer << (5 - bits)) & 31));
        }
        return out.toString();
    }

    private static byte[] fromBase32(String value) {
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace("=", "");
        int buffer = 0;
        int bits = 0;
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        for (int i = 0; i < normalized.length(); i++) {
            int idx = ALPHABET.indexOf(normalized.charAt(i));
            if (idx < 0) {
                continue;
            }
            buffer = (buffer << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                out.write((buffer >> (bits - 8)) & 0xff);
                bits -= 8;
            }
        }
        return out.toByteArray();
    }

    private static String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
