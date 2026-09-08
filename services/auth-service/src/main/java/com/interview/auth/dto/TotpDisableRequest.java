package com.interview.auth.dto;

public record TotpDisableRequest(String password, String code) {}
