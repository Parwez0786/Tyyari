package com.interview.content.service;

import com.interview.content.dto.ContentStats;
import com.interview.content.dto.PageResponse;
import com.interview.content.dto.QuestionDetail;
import com.interview.content.dto.QuestionListItem;
import com.interview.content.dto.QuestionWriteRequest;
import com.interview.content.event.ContentEventPublisher;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.Question;
import com.interview.content.repository.QuestionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class QuestionService {
    private final QuestionRepository questions;
    private final MongoTemplate mongoTemplate;
    private final ContentCache cache;
    private final ContentEventPublisher events;

    public QuestionService(
            QuestionRepository questions,
            MongoTemplate mongoTemplate,
            ContentCache cache,
            ContentEventPublisher events
    ) {
        this.questions = questions;
        this.mongoTemplate = mongoTemplate;
        this.cache = cache;
        this.events = events;
    }

    public PageResponse<QuestionListItem> search(
            String type,
            String difficulty,
            String company,
            String topic,
            String tag,
            String search,
            int page,
            int limit,
            String sort,
            boolean publishedOnly
    ) {
        int safePage = Math.max(page, 1);
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();
        if (publishedOnly) {
            criteria.add(Criteria.where("isPublished").is(true));
        }
        if (StringUtils.hasText(type)) {
            criteria.add(Criteria.where("type").is(type.toUpperCase(Locale.ROOT)));
        }
        if (StringUtils.hasText(difficulty)) {
            criteria.add(Criteria.where("difficulty").is(difficulty.toUpperCase(Locale.ROOT)));
        }
        if (StringUtils.hasText(company)) {
            criteria.add(Criteria.where("companies").regex("^" + Pattern.quote(company) + "$", "i"));
        }
        if (StringUtils.hasText(topic)) {
            criteria.add(Criteria.where("topics").regex("^" + Pattern.quote(topic) + "$", "i"));
        }
        if (StringUtils.hasText(tag)) {
            criteria.add(Criteria.where("tags").regex("^" + Pattern.quote(tag) + "$", "i"));
        }
        if (StringUtils.hasText(search)) {
            criteria.add(Criteria.where("title").regex(Pattern.quote(search), "i"));
        }
        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
        }
        long total = mongoTemplate.count(query, Question.class);
        Sort mongoSort = "oldest".equalsIgnoreCase(sort)
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();
        query.with(PageRequest.of(safePage - 1, safeLimit, mongoSort));
        List<QuestionListItem> items = mongoTemplate.find(query, Question.class).stream()
                .map(this::toListItem)
                .toList();
        return new PageResponse<>(items, total, safePage, safeLimit);
    }

    public QuestionDetail getPublished(String id) {
        Question cached = cache.getQuestion(id);
        if (cached != null && cached.isPublished()) {
            return toDetail(cached);
        }
        Question question = questions.findById(id)
                .or(() -> questions.findBySlug(id))
                .filter(Question::isPublished)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND));
        cache.putQuestion(question);
        return toDetail(question);
    }

    public List<String> hints(String id) {
        Question question = questions.findById(id)
                .or(() -> questions.findBySlug(id))
                .filter(Question::isPublished)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND));
        return question.getHints() == null ? List.of() : question.getHints();
    }

    public Question getRaw(String id) {
        return questions.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND));
    }

    public Question create(QuestionWriteRequest req, String actorId) {
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : Slugs.from(req.title());
        if (questions.existsBySlug(slug)) {
            throw new ApiException(ErrorCode.QUESTION_ALREADY_EXISTS, "Question slug already exists", HttpStatus.CONFLICT);
        }
        Instant now = Instant.now();
        Question saved = questions.save(apply(Question.builder()
                .slug(slug)
                .createdBy(actorId)
                .published(Boolean.TRUE.equals(req.published()))
                .createdAt(now)
                .updatedAt(now)
                .build(), req));
        events.publish("QUESTION_CREATED", saved.getId(), Map.of("actorId", nvl(actorId), "slug", saved.getSlug()));
        return saved;
    }

    public Question update(String id, QuestionWriteRequest req, String actorId) {
        Question existing = getRaw(id);
        Question saved = apply(existing, req);
        saved.setUpdatedAt(Instant.now());
        saved = questions.save(saved);
        cache.evictQuestion(id);
        events.publish("QUESTION_UPDATED", id, Map.of("actorId", nvl(actorId)));
        return saved;
    }

    public void delete(String id, String actorId) {
        if (!questions.existsById(id)) {
            throw new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND);
        }
        questions.deleteById(id);
        cache.evictQuestion(id);
        events.publish("QUESTION_DELETED", id, Map.of("actorId", nvl(actorId)));
    }

    public Question publish(String id, boolean published, String actorId) {
        Question question = getRaw(id);
        question.setPublished(published);
        question.setUpdatedAt(Instant.now());
        Question saved = questions.save(question);
        cache.evictQuestion(id);
        events.publish(published ? "QUESTION_PUBLISHED" : "QUESTION_UNPUBLISHED", id, Map.of("actorId", nvl(actorId)));
        return saved;
    }

    public ContentStats stats() {
        Map<String, Long> byType = new HashMap<>();
        for (String type : List.of("DSA", "HLD", "LLD", "CS", "FRONTEND", "OA")) {
            byType.put(type, questions.countByTypeAndPublishedTrue(type));
        }
        return new ContentStats(questions.countByPublishedTrue(), byType);
    }

    private Question apply(Question question, QuestionWriteRequest req) {
        if (req.type() != null) question.setType(req.type().toUpperCase(Locale.ROOT));
        if (req.subType() != null) question.setSubType(req.subType());
        if (req.title() != null) question.setTitle(req.title());
        if (req.description() != null) question.setDescription(req.description());
        if (req.difficulty() != null) question.setDifficulty(req.difficulty().toUpperCase(Locale.ROOT));
        if (req.topics() != null) question.setTopics(req.topics());
        if (req.companies() != null) question.setCompanies(req.companies());
        if (req.tags() != null) question.setTags(req.tags());
        if (req.constraints() != null) question.setConstraints(req.constraints());
        if (req.functionalRequirements() != null) question.setFunctionalRequirements(req.functionalRequirements());
        if (req.nonFunctionalRequirements() != null) question.setNonFunctionalRequirements(req.nonFunctionalRequirements());
        if (req.examples() != null) question.setExamples(req.examples());
        if (req.hints() != null) question.setHints(req.hints());
        if (req.published() != null) question.setPublished(req.published());
        if (req.slug() != null) question.setSlug(Slugs.from(req.slug()));
        return question;
    }

    private QuestionListItem toListItem(Question q) {
        return new QuestionListItem(
                q.getId(),
                q.getTitle(),
                q.getSlug(),
                q.getType(),
                q.getDifficulty(),
                q.getDescription(),
                q.getTopics(),
                q.getCompanies(),
                false,
                q.isPremium()
        );
    }

    private QuestionDetail toDetail(Question q) {
        return new QuestionDetail(
                q.getId(),
                q.getTitle(),
                q.getSlug(),
                q.getType(),
                q.getSubType(),
                q.getDifficulty(),
                q.getDescription(),
                q.getTopics(),
                q.getCompanies(),
                q.getTags(),
                q.getConstraints(),
                q.getFunctionalRequirements(),
                q.getNonFunctionalRequirements(),
                q.getExamples(),
                q.getHints()
        );
    }

    private static String nvl(String value) {
        return value == null ? "" : value;
    }
}
