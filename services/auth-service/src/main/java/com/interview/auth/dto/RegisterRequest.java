package com.interview.auth.dto;

import com.interview.auth.util.EmailAddresses;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 80) String name,
        @NotBlank
        @Size(max = 254)
        @Email(regexp = EmailAddresses.REGEXP, message = EmailAddresses.MESSAGE)
        String email,
        @NotBlank @Size(min = 8, max = 72) String password
) {}
