package com.interview.auth;

import com.interview.auth.util.EmailAddresses;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailAddressesTest {

    @Test
    void acceptsRealAddresses() {
        assertTrue(EmailAddresses.isValid("demo@tyyari.dev"));
        assertTrue(EmailAddresses.isValid("user.name+tag@gmail.com"));
    }

    @Test
    void rejectsInvalidAddresses() {
        assertFalse(EmailAddresses.isValid(""));
        assertFalse(EmailAddresses.isValid("not-an-email"));
        assertFalse(EmailAddresses.isValid("user@localhost"));
        assertFalse(EmailAddresses.isValid("a@b"));
        assertFalse(EmailAddresses.isValid("user@.com"));
        assertFalse(EmailAddresses.isValid("user@domain."));
        assertFalse(EmailAddresses.isValid("user..name@gmail.com"));
    }
}
