package com.interview.content.service;

import java.util.Locale;
import java.util.regex.Pattern;

public final class Slugs {
    private static final Pattern NON_SLUG = Pattern.compile("[^a-z0-9]+");

    private Slugs() {}

    public static String from(String value) {
        if (value == null) {
            return "";
        }
        String slug = NON_SLUG.matcher(value.toLowerCase(Locale.ROOT).trim()).replaceAll("-");
        return slug.replaceAll("(^-|-$)", "");
    }
}
