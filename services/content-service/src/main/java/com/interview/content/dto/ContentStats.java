package com.interview.content.dto;

import java.util.Map;

public record ContentStats(long publishedQuestions, Map<String, Long> byType) {}
