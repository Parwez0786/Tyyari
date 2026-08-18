package com.interview.content.service;

import com.interview.content.dto.AssessmentSetDetail;
import com.interview.content.dto.AssessmentSetListItem;
import com.interview.content.dto.QuestionListItem;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.AssessmentSet;
import com.interview.content.repository.AssessmentSetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

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
