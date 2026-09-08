package com.interview.content.dto;

import java.util.List;

public record QuestionImportResult(int created, int skipped, List<String> errors) {}
