package com.interview.auth.mail;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailTemplatesTest {

    @Test
    void usesTyyariMarkAndHomeLink() {
        String html = EmailTemplates.page(
                "Check your inbox",
                "Confirm your email",
                "Use this inbox to finish creating your Tyyari account.",
                "Verify my email",
                "https://app.tyyari.dev/verify-email?token=abc",
                "This link expires in 2 days.",
                "https://app.tyyari.dev"
        );
        assertTrue(html.contains("cid:" + EmailTemplates.MARK_CID));
        assertTrue(html.contains("alt=\"Tyyari\""));
        assertTrue(html.contains("Same library. Same orange."));
        assertTrue(html.contains("href=\"https://app.tyyari.dev\""));
        assertTrue(html.contains(">Tyyari<"));
    }
}
