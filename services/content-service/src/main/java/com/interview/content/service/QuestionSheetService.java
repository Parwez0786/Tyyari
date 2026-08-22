package com.interview.content.service;

import com.interview.content.dto.QuestionListItem;
import com.interview.content.dto.SheetDetail;
import com.interview.content.dto.SheetListItem;
import com.interview.content.dto.SheetWriteRequest;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.QuestionSheet;
import com.interview.content.repository.QuestionSheetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
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

    public List<QuestionSheet> listAll() {
        return sheets.findAllByOrderByUpdatedAtDesc();
    }

    public QuestionSheet getRaw(String id) {
        return sheets.findById(id)
                .or(() -> sheets.findBySlug(id))
                .orElseThrow(() -> new ApiException(ErrorCode.SHEET_NOT_FOUND, "Sheet not found", HttpStatus.NOT_FOUND));
    }

    public QuestionSheet create(SheetWriteRequest req) {
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : Slugs.from(req.title());
        if (!StringUtils.hasText(slug)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Title or slug is required", HttpStatus.BAD_REQUEST);
        }
        if (sheets.existsBySlug(slug)) {
            throw new ApiException(ErrorCode.QUESTION_ALREADY_EXISTS, "Sheet slug already exists", HttpStatus.CONFLICT);
        }
        if (!StringUtils.hasText(req.type())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Sheet type is required", HttpStatus.BAD_REQUEST);
        }
        Instant now = Instant.now();
        return sheets.save(apply(QuestionSheet.builder()
                .slug(slug)
                .type(req.type().toUpperCase(Locale.ROOT))
                .published(Boolean.TRUE.equals(req.published()))
                .createdAt(now)
                .updatedAt(now)
                .build(), req, slug));
    }

    public QuestionSheet update(String id, SheetWriteRequest req) {
        QuestionSheet existing = getRaw(id);
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : existing.getSlug();
        if (StringUtils.hasText(slug) && !slug.equals(existing.getSlug()) && sheets.existsBySlug(slug)) {
            throw new ApiException(ErrorCode.QUESTION_ALREADY_EXISTS, "Sheet slug already exists", HttpStatus.CONFLICT);
        }
        QuestionSheet saved = apply(existing, req, slug);
        saved.setUpdatedAt(Instant.now());
        return sheets.save(saved);
    }

    public void delete(String id) {
        QuestionSheet existing = getRaw(id);
        sheets.deleteById(existing.getId());
    }

    public QuestionSheet publish(String id, boolean published) {
        QuestionSheet existing = getRaw(id);
        existing.setPublished(published);
        existing.setUpdatedAt(Instant.now());
        return sheets.save(existing);
    }

    private QuestionSheet apply(QuestionSheet sheet, SheetWriteRequest req, String slug) {
        if (slug != null) sheet.setSlug(slug);
        if (req.title() != null) sheet.setTitle(req.title());
        if (req.description() != null) sheet.setDescription(req.description());
        if (req.type() != null) sheet.setType(req.type().toUpperCase(Locale.ROOT));
        if (req.difficulty() != null) sheet.setDifficulty(req.difficulty().toUpperCase(Locale.ROOT));
        if (req.companies() != null) sheet.setCompanies(req.companies());
        if (req.questionSlugs() != null) sheet.setQuestionSlugs(req.questionSlugs());
        if (req.published() != null) sheet.setPublished(req.published());
        return sheet;
    }

    private List<QuestionListItem> questionsForSheet(QuestionSheet sheet) {
        String type = sheet.getType();
        return questions.publishedBySlugs(sheet.getQuestionSlugs()).stream()
                .filter(item -> !StringUtils.hasText(type) || type.equalsIgnoreCase(item.type()))
                .toList();
    }
}
