package com.interview.content.service;

import com.interview.content.dto.QuestionListItem;
import com.interview.content.dto.SheetDetail;
import com.interview.content.dto.SheetListItem;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.QuestionSheet;
import com.interview.content.repository.QuestionSheetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
public class QuestionSheetService {

    private final QuestionSheetRepository sheets;
    private final QuestionService questions;

    public QuestionSheetService(QuestionSheetRepository sheets, QuestionService questions) {
        this.sheets = sheets;
        this.questions = questions;
    }

    public List<SheetListItem> listPublished(String type) {
        List<QuestionSheet> items = StringUtils.hasText(type)
                ? sheets.findByTypeAndPublishedTrueOrderByCreatedAtAsc(type.toUpperCase(Locale.ROOT))
                : sheets.findByPublishedTrueOrderByCreatedAtAsc();
        return items.stream().map(this::toListItem).toList();
    }

    public SheetDetail getPublished(String id) {
        QuestionSheet sheet = sheets.findById(id)
                .or(() -> sheets.findBySlug(id))
                .filter(QuestionSheet::isPublished)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.SHEET_NOT_FOUND,
                        "Sheet not found",
                        HttpStatus.NOT_FOUND
                ));
        List<QuestionListItem> items = questionsForSheet(sheet);
        return new SheetDetail(
                sheet.getId(),
                sheet.getSlug(),
                sheet.getTitle(),
                sheet.getDescription(),
                sheet.getType(),
                sheet.getDifficulty(),
                sheet.getCompanies(),
                items
        );
    }

    private SheetListItem toListItem(QuestionSheet sheet) {
        List<QuestionListItem> items = questionsForSheet(sheet);
        return new SheetListItem(
                sheet.getId(),
                sheet.getSlug(),
                sheet.getTitle(),
                sheet.getDescription(),
                sheet.getType(),
                sheet.getDifficulty(),
                sheet.getCompanies(),
                items.size(),
                items.stream().map(QuestionListItem::id).toList()
        );
    }

    private List<QuestionListItem> questionsForSheet(QuestionSheet sheet) {
        String type = sheet.getType();
        return questions.publishedBySlugs(sheet.getQuestionSlugs()).stream()
                .filter(item -> !StringUtils.hasText(type) || type.equalsIgnoreCase(item.type()))
                .toList();
    }
}
