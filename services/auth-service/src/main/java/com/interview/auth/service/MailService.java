package com.interview.auth.service;

import com.interview.auth.mail.EmailTemplates;
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

    public void sendInvite(String to, String name, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        send(to, "Set your Tyyari password", EmailTemplates.page(
                "You're invited",
                "Join Tyyari",
                EmailTemplates.greeting(name) + "An admin created this account. Set a password to sign in.",
                "Set your password",
                link,
                "This link expires in 1 hour. After that, ask an admin to send another invite."
        ));
    }

    public void sendPasswordReset(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        try {
            send(to, "Reset your Tyyari password", EmailTemplates.page(
                    "Account",
                    "Reset your password",
                    "We received a request to reset the password for this Tyyari account.",
                    "Choose a new password",
                    link,
                    "This link expires in 1 hour. If you did not ask for it, ignore this email."
            ));
        } catch (RuntimeException e) {
            log.warn("Password reset email was not delivered to {}", to);
        }
    }

    public void sendVerification(String to, String name, String token) {
        String link = frontendUrl + "/verify-email?token=" + java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8);
        send(to, "Verify your Tyyari email", EmailTemplates.page(
                "Check your inbox",
                "Confirm your email",
                EmailTemplates.greeting(name) + "Use this inbox to finish creating your Tyyari account.",
                "Verify my email",
                link,
                "This link expires in 2 days. If you did not create an account, ignore this email."
        ));
    }

    public void sendWelcome(String to, String name) {
        try {
            send(to, "Welcome to Tyyari", EmailTemplates.page(
                    "You're in",
                    "Welcome to Tyyari",
                    EmailTemplates.greeting(name) + "Your interview prep workspace is ready. Pick a track and start with a question today.",
                    "Open dashboard",
                    frontendUrl + "/dashboard",
                    "Same editors. Same orange."
            ));
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
