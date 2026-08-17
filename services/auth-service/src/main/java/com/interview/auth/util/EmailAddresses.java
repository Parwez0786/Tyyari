package com.interview.auth.util;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;

import java.util.Locale;
import java.util.regex.Pattern;

public final class EmailAddresses {
    public static final String REGEXP = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$";
    public static final String MESSAGE = "must be a valid email address";
    private static final Pattern PATTERN = Pattern.compile(REGEXP);

    private EmailAddresses() {}

    public static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public static boolean isValid(String email) {
        if (email == null || email.isBlank() || email.length() > 254) {
            return false;
        }
        if (email.contains("..") || email.startsWith(".") || email.endsWith(".")) {
            return false;
        }
        int at = email.indexOf('@');
        if (at < 1 || at != email.lastIndexOf('@')) {
            return false;
        }
        String domain = email.substring(at + 1);
        if (domain.startsWith("-") || domain.startsWith(".") || domain.endsWith("-") || !domain.contains(".")) {
            return false;
        }
        if (!PATTERN.matcher(email).matches()) {
            return false;
        }
        try {
            InternetAddress address = new InternetAddress(email, true);
            address.validate();
            return true;
        } catch (AddressException e) {
            return false;
        }
    }
}
