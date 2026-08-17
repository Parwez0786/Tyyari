package com.interview.auth.dto;

import com.interview.auth.util.EmailAddresses;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank
        @Size(max = 254)
        @Email(regexp = EmailAddresses.REGEXP, message = EmailAddresses.MESSAGE)
        String email,
        @NotBlank String password
) {}
