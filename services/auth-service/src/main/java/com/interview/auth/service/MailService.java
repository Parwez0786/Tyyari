package com.interview.auth.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final String frontendUrl;

    public MailService(
            JavaMailSender mailSender,
            @Value("${app.mail-from}") String from,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    public void sendPasswordReset(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        try {
            send(to, "Reset your Tyyari password", """
                    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
                      <h2 style="color:#7C3AED">Reset your password</h2>
                      <p>We received a request to reset the password for this Tyyari account.</p>
                      <p><a href="%s" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600">Choose a new password</a></p>
                      <p style="color:#6B7280;font-size:13px">This link expires in 1 hour. If you didn't ask for it, you can ignore this email.</p>
                    </div>
                    """.formatted(link));
        } catch (RuntimeException e) {
            log.warn("Password reset email was not delivered to {}", to);
        }
    }

    public void sendVerification(String to, String name, String token) {
        String link = frontendUrl + "/verify-email?token=" + java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8);
        String greeting = name == null || name.isBlank() ? "" : ", " + name;
        send(to, "Verify your Tyyari email", """
                <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
                  <h2 style="color:#7C3AED">Confirm your email%s</h2>
                  <p>Use a real inbox to finish creating your Tyyari account. This proves the address belongs to you.</p>
                  <p><a href="%s" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600">Verify my email</a></p>
                  <p style="color:#6B7280;font-size:13px">This link expires in 2 days. If you didn't create an account, you can ignore this email.</p>
                </div>
                """.formatted(greeting, link));
    }

    public void sendWelcome(String to, String name) {
        try {
            send(to, "Welcome to Tyyari", """
                    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
                      <h2 style="color:#7C3AED">Welcome%s</h2>
                      <p>Your interview prep workspace is ready. Pick a track and start with a question today.</p>
                      <p><a href="%s/dashboard" style="color:#7C3AED">Open Tyyari</a></p>
                    </div>
                    """.formatted(name == null || name.isBlank() ? "" : ", " + name, frontendUrl));
        } catch (RuntimeException e) {
            log.warn("Welcome email was not delivered to {}", to);
        }
    }

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent '{}' to {}", subject, to);
        } catch (Exception e) {
            log.error("Failed to send '{}' to {}", subject, to, e);
            throw new IllegalStateException("Failed to send mail", e);
        }
    }
}
