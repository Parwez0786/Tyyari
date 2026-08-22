package com.interview.content.service;

import com.interview.content.dto.AssessmentSetDetail;
import com.interview.content.dto.AssessmentSetListItem;
import com.interview.content.dto.AssessmentWriteRequest;
import com.interview.content.dto.QuestionListItem;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.AssessmentSet;
import com.interview.content.repository.AssessmentSetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class AssessmentSetService {

    private final AssessmentSetRepository sets;
    private final QuestionService questions;

    public AssessmentSetService(AssessmentSetRepository sets, QuestionService questions) {
        this.sets = sets;
        this.questions = questions;
    }

    public List<AssessmentSetListItem> listPublished() {
        return sets.findByPublishedTrueOrderByCreatedAtAsc().stream()
                .map(this::toListItem)
                .toList();
    }

    public AssessmentSetDetail getPublished(String id) {
        AssessmentSet set = sets.findById(id)
                .or(() -> sets.findBySlug(id))
                .filter(AssessmentSet::isPublished)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.ASSESSMENT_NOT_FOUND,
                        "Assessment not found",
                        HttpStatus.NOT_FOUND
                ));
        List<QuestionListItem> items = questions.publishedDsaBySlugs(set.getQuestionSlugs());
        return new AssessmentSetDetail(
                set.getId(),
                set.getSlug(),
                set.getTitle(),
                set.getDescription(),
                set.getDurationMinutes(),
                set.getDifficulty(),
                set.getCompanies(),
                items,
                true
        );
    }

    public List<AssessmentSet> listAll() {
        return sets.findAllByOrderByUpdatedAtDesc();
    }

    public AssessmentSet getRaw(String id) {
        return sets.findById(id)
                .or(() -> sets.findBySlug(id))
                .orElseThrow(() -> new ApiException(ErrorCode.ASSESSMENT_NOT_FOUND, "Assessment not found", HttpStatus.NOT_FOUND));
    }

    public AssessmentSet create(AssessmentWriteRequest req) {
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : Slugs.from(req.title());
        if (!StringUtils.hasText(slug)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Title or slug is required", HttpStatus.BAD_REQUEST);
        }
        if (sets.existsBySlug(slug)) {
            throw new ApiException(ErrorCode.QUESTION_ALREADY_EXISTS, "Assessment slug already exists", HttpStatus.CONFLICT);
        }
        Instant now = Instant.now();
        int duration = req.durationMinutes() != null ? Math.max(1, req.durationMinutes()) : 90;
        return sets.save(apply(AssessmentSet.builder()
                .slug(slug)
                .durationMinutes(duration)
                .published(Boolean.TRUE.equals(req.published()))
                .createdAt(now)
                .updatedAt(now)
                .build(), req, slug));
    }

    public AssessmentSet update(String id, AssessmentWriteRequest req) {
        AssessmentSet existing = getRaw(id);
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : existing.getSlug();
        if (StringUtils.hasText(slug) && !slug.equals(existing.getSlug()) && sets.existsBySlug(slug)) {
            throw new ApiException(ErrorCode.QUESTION_ALREADY_EXISTS, "Assessment slug already exists", HttpStatus.CONFLICT);
        }
        AssessmentSet saved = apply(existing, req, slug);
        saved.setUpdatedAt(Instant.now());
        return sets.save(saved);
    }

    public void delete(String id) {
        AssessmentSet existing = getRaw(id);
        sets.deleteById(existing.getId());
    }

    public AssessmentSet publish(String id, boolean published) {
        AssessmentSet existing = getRaw(id);
        existing.setPublished(published);
        existing.setUpdatedAt(Instant.now());
        return sets.save(existing);
    }

    private AssessmentSet apply(AssessmentSet set, AssessmentWriteRequest req, String slug) {
        if (slug != null) set.setSlug(slug);
        if (req.title() != null) set.setTitle(req.title());
        if (req.description() != null) set.setDescription(req.description());
        if (req.durationMinutes() != null) set.setDurationMinutes(Math.max(1, req.durationMinutes()));
        if (req.difficulty() != null) set.setDifficulty(req.difficulty().toUpperCase(Locale.ROOT));
        if (req.companies() != null) set.setCompanies(req.companies());
        if (req.questionSlugs() != null) set.setQuestionSlugs(req.questionSlugs());
        if (req.published() != null) set.setPublished(req.published());
        return set;
    }

    private AssessmentSetListItem toListItem(AssessmentSet set) {
        int count = questions.publishedDsaBySlugs(set.getQuestionSlugs()).size();
        return new AssessmentSetListItem(
                set.getId(),
                set.getSlug(),
                set.getTitle(),
                set.getDescription(),
                set.getDurationMinutes(),
                set.getDifficulty(),
                set.getCompanies(),
                count
        );
    }
}
