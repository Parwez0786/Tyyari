package com.interview.content.service;

import com.interview.content.dto.ContentStats;
import com.interview.content.dto.PageResponse;
import com.interview.content.dto.QuestionDetail;
import com.interview.content.dto.QuestionImportRequest;
import com.interview.content.dto.QuestionImportResult;
import com.interview.content.dto.QuestionListItem;
import com.interview.content.dto.QuestionReviewRequest;
import com.interview.content.dto.QuestionUsage;
import com.interview.content.dto.QuestionWriteRequest;
import com.interview.content.event.ContentEventPublisher;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.Question;
import com.interview.content.repository.AssessmentSetRepository;
import com.interview.content.repository.QuestionRepository;
import com.interview.content.repository.QuestionSheetRepository;
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
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class QuestionService {
    private final QuestionRepository questions;
    private final QuestionSheetRepository sheets;
    private final AssessmentSetRepository assessmentSets;
    private final MongoTemplate mongoTemplate;
    private final ContentCache cache;
    private final ContentEventPublisher events;

    public QuestionService(
            QuestionRepository questions,
            QuestionSheetRepository sheets,
            AssessmentSetRepository assessmentSets,
            MongoTemplate mongoTemplate,
            ContentCache cache,
            ContentEventPublisher events
    ) {
        this.questions = questions;
        this.sheets = sheets;
        this.assessmentSets = assessmentSets;
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
            String reviewStatus,
            int page,
            int limit,
            String sort,
            boolean publishedOnly
    ) {
        int safePage = Math.max(page, 1);
        int maxLimit = publishedOnly ? 50 : 200;
        int safeLimit = Math.min(Math.max(limit, 1), maxLimit);
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
        if (StringUtils.hasText(reviewStatus)) {
            String status = reviewStatus.toUpperCase(Locale.ROOT);
            if ("DRAFT".equals(status)) {
                criteria.add(new Criteria().orOperator(
                        Criteria.where("reviewStatus").is("DRAFT"),
                        Criteria.where("reviewStatus").is(null),
                        Criteria.where("reviewStatus").exists(false)
                ));
            } else {
                criteria.add(Criteria.where("reviewStatus").is(status));
            }
        }
        if (StringUtils.hasText(search)) {
            String rx = Pattern.quote(search);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("title").regex(rx, "i"),
                    Criteria.where("slug").regex(rx, "i"),
                    Criteria.where("companies").regex(rx, "i"),
                    Criteria.where("topics").regex(rx, "i")
            ));
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

    public QuestionDetail getPublished(String id, boolean entitled) {
        Question cached = cache.getQuestion(id);
        if (cached != null && cached.isPublished()) {
            return entitled || !cached.isPremium() ? toDetail(cached) : toLockedDetail(cached);
        }
        Question question = questions.findById(id)
                .or(() -> questions.findBySlug(id))
                .filter(Question::isPublished)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND));
        cache.putQuestion(question);
        return entitled || !question.isPremium() ? toDetail(question) : toLockedDetail(question);
    }

    public List<QuestionListItem> publishedDsaBySlugs(List<String> slugs) {
        return publishedBySlugs(slugs).stream()
                .filter(item -> "DSA".equalsIgnoreCase(item.type()))
                .filter(item -> !item.premium())
                .toList();
    }

    public List<QuestionListItem> publishedBySlugs(List<String> slugs) {
        if (slugs == null || slugs.isEmpty()) {
            return List.of();
        }
        return slugs.stream()
                .map(questions::findBySlug)
                .flatMap(Optional::stream)
                .filter(Question::isPublished)
                .map(this::toListItem)
                .toList();
    }

    public List<String> hints(String id, boolean entitled) {
        Question question = questions.findById(id)
                .or(() -> questions.findBySlug(id))
                .filter(Question::isPublished)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND));
        if (question.isPremium() && !entitled) {
            throw new ApiException(ErrorCode.PREMIUM_REQUIRED, "Upgrade to Premium to view hints", HttpStatus.FORBIDDEN);
        }
        return question.getHints() == null ? List.of() : question.getHints();
    }

    public Question getRaw(String id) {
        return questions.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND, "Question not found", HttpStatus.NOT_FOUND));
    }

    public Map<String, String> titles(Collection<String> ids) {
        Map<String, String> out = new LinkedHashMap<>();
        if (ids == null || ids.isEmpty()) {
            return out;
        }
        List<String> wanted = ids.stream().filter(StringUtils::hasText).map(String::trim).distinct().toList();
        for (Question question : questions.findAllById(wanted)) {
            if (StringUtils.hasText(question.getTitle())) {
                out.put(question.getId(), question.getTitle());
            }
        }
        for (String id : wanted) {
            if (out.containsKey(id)) {
                continue;
            }
            questions.findBySlug(id).ifPresent(question -> {
                if (StringUtils.hasText(question.getTitle())) {
                    out.put(id, question.getTitle());
                }
            });
        }
        return out;
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
                .reviewStatus(Boolean.TRUE.equals(req.published()) ? "APPROVED" : "DRAFT")
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
        if (published) {
            question.setReviewStatus("APPROVED");
        }
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
        if (req.testcases() != null) question.setTestcases(req.testcases());
        if (req.starterFiles() != null) question.setStarterFiles(req.starterFiles());
        if (req.estimates() != null) question.setEstimates(req.estimates());
        if (req.canvasNotes() != null) question.setCanvasNotes(req.canvasNotes());
        if (req.quiz() != null) question.setQuiz(req.quiz());
        if (req.hints() != null) question.setHints(req.hints());
        if (req.editorial() != null) question.setEditorial(req.editorial());
        if (req.editorialVideoUrl() != null) question.setEditorialVideoUrl(req.editorialVideoUrl());
        if (req.acceptedCode() != null) question.setAcceptedCode(req.acceptedCode());
        if (req.reviewStatus() != null) question.setReviewStatus(normalizeReview(req.reviewStatus()));
        if (req.reviewer() != null) question.setReviewer(req.reviewer());
        if (req.reviewNote() != null) question.setReviewNote(req.reviewNote());
        if (req.scheduledPublishAt() != null) question.setScheduledPublishAt(req.scheduledPublishAt());
        if (req.published() != null) question.setPublished(req.published());
        if (req.premium() != null) question.setPremium(req.premium());
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
                q.isPremium(),
                q.isPublished(),
                reviewStatusOf(q),
                q.getScheduledPublishAt()
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
                q.getTestcases(),
                q.getStarterFiles(),
                q.getEstimates(),
                q.getCanvasNotes(),
                q.getQuiz(),
                q.getHints(),
                q.getEditorial(),
                q.getEditorialVideoUrl(),
                q.getAcceptedCode(),
                q.isPremium(),
                false
        );
    }

    private QuestionDetail toLockedDetail(Question q) {
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
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                "",
                "",
                List.of(),
                List.of(),
                "",
                "",
                List.of(),
                true,
                true
        );
    }

    public Question review(String id, QuestionReviewRequest req, String actorId) {
        Question question = getRaw(id);
        if (req.reviewStatus() != null) {
            question.setReviewStatus(normalizeReview(req.reviewStatus()));
        }
        if (req.reviewer() != null) {
            question.setReviewer(req.reviewer());
        }
        if (req.reviewNote() != null) {
            question.setReviewNote(req.reviewNote());
        }
        if (req.scheduledPublishAt() != null) {
            question.setScheduledPublishAt(req.scheduledPublishAt());
        }
        question.setUpdatedAt(Instant.now());
        Question saved = questions.save(question);
        cache.evictQuestion(id);
        events.publish("QUESTION_REVIEWED", id, Map.of("actorId", nvl(actorId), "reviewStatus", nvl(saved.getReviewStatus())));
        return saved;
    }

    public QuestionUsage usage(String id) {
        Question question = getRaw(id);
        String slug = question.getSlug();
        List<QuestionUsage.Ref> sheetRefs = sheets.findByQuestionSlugsContaining(slug).stream()
                .map(sheet -> new QuestionUsage.Ref(sheet.getId(), sheet.getTitle(), sheet.getSlug()))
                .toList();
        List<QuestionUsage.Ref> oaRefs = assessmentSets.findByQuestionSlugsContaining(slug).stream()
                .map(set -> new QuestionUsage.Ref(set.getId(), set.getTitle(), set.getSlug()))
                .toList();
        return new QuestionUsage(sheetRefs, oaRefs);
    }

    public Map<String, Long> countByType(String search, String reviewStatus) {
        Map<String, Long> out = new LinkedHashMap<>();
        for (String type : List.of("DSA", "HLD", "LLD", "CS", "FRONTEND", "OA")) {
            out.put(type, search(type, null, null, null, null, search, reviewStatus, 1, 1, null, false).total());
        }
        return out;
    }

    public QuestionImportResult importCsv(String csv, String actorId) {
        return importQuestions(new QuestionImportRequest(parseCsvItems(csv)), actorId);
    }

    public QuestionImportResult importQuestions(QuestionImportRequest request, String actorId) {
        List<QuestionWriteRequest> items = request == null || request.items() == null ? List.of() : request.items();
        int created = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            QuestionWriteRequest item = items.get(i);
            try {
                if (item == null || !StringUtils.hasText(item.title())) {
                    skipped++;
                    errors.add("Row " + (i + 1) + ": title is required");
                    continue;
                }
                create(item, actorId);
                created++;
            } catch (ApiException e) {
                skipped++;
                errors.add("Row " + (i + 1) + ": " + e.getMessage());
            } catch (RuntimeException e) {
                skipped++;
                errors.add("Row " + (i + 1) + ": " + e.getMessage());
            }
        }
        return new QuestionImportResult(created, skipped, errors);
    }

    public List<Question> exportAll() {
        return questions.findAll();
    }

    public String exportCsv() {
        StringBuilder out = new StringBuilder();
        out.append("title,slug,type,difficulty,description,topics,companies,tags,hints,published,premium,reviewStatus,editorial\n");
        for (Question q : questions.findAll()) {
            out.append(csv(q.getTitle())).append(',')
                    .append(csv(q.getSlug())).append(',')
                    .append(csv(q.getType())).append(',')
                    .append(csv(q.getDifficulty())).append(',')
                    .append(csv(q.getDescription())).append(',')
                    .append(csv(join(q.getTopics()))).append(',')
                    .append(csv(join(q.getCompanies()))).append(',')
                    .append(csv(join(q.getTags()))).append(',')
                    .append(csv(join(q.getHints()))).append(',')
                    .append(q.isPublished()).append(',')
                    .append(q.isPremium()).append(',')
                    .append(csv(reviewStatusOf(q))).append(',')
                    .append(csv(q.getEditorial())).append('\n');
        }
        return out.toString();
    }

    private static String reviewStatusOf(Question q) {
        return StringUtils.hasText(q.getReviewStatus()) ? q.getReviewStatus() : "DRAFT";
    }

    private static String normalizeReview(String value) {
        String status = value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        return switch (status) {
            case "DRAFT", "IN_REVIEW", "NEEDS_CHANGES", "APPROVED" -> status;
            default -> throw new ApiException(ErrorCode.VALIDATION_ERROR, "Use DRAFT, IN_REVIEW, NEEDS_CHANGES, or APPROVED", HttpStatus.BAD_REQUEST);
        };
    }

    private static String join(List<String> values) {
        return values == null ? "" : String.join("|", values);
    }

    private static String csv(String value) {
        String raw = value == null ? "" : value.replace("\"", "\"\"");
        return "\"" + raw + "\"";
    }

    private static String nvl(String value) {
        return value == null ? "" : value;
    }

    private static List<QuestionWriteRequest> parseCsvItems(String csv) {
        List<List<String>> rows = parseCsvRows(csv == null ? "" : csv);
        if (rows.isEmpty()) {
            return List.of();
        }
        List<String> header = rows.get(0).stream().map(h -> h.trim().toLowerCase(Locale.ROOT)).toList();
        List<QuestionWriteRequest> items = new ArrayList<>();
        for (int i = 1; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            if (row.stream().allMatch(String::isBlank)) {
                continue;
            }
            items.add(new QuestionWriteRequest(
                    cell(header, row, "type"),
                    null,
                    cell(header, row, "title"),
                    cell(header, row, "slug"),
                    cell(header, row, "description"),
                    cell(header, row, "difficulty"),
                    splitCell(cell(header, row, "topics")),
                    splitCell(cell(header, row, "companies")),
                    splitCell(cell(header, row, "tags")),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    splitCell(cell(header, row, "hints")),
                    cell(header, row, "editorial"),
                    cell(header, row, "editorialvideourl"),
                    null,
                    cell(header, row, "reviewstatus"),
                    null,
                    null,
                    null,
                    parseBool(cell(header, row, "published")),
                    parseBool(cell(header, row, "premium"))
            ));
        }
        return items;
    }

    private static List<List<String>> parseCsvRows(String csv) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < csv.length(); i++) {
            char c = csv.charAt(i);
            if (quoted) {
                if (c == '"') {
                    if (i + 1 < csv.length() && csv.charAt(i + 1) == '"') {
                        cell.append('"');
                        i++;
                    } else {
                        quoted = false;
                    }
                } else {
                    cell.append(c);
                }
            } else if (c == '"') {
                quoted = true;
            } else if (c == ',') {
                row.add(cell.toString());
                cell.setLength(0);
            } else if (c == '\n') {
                row.add(cell.toString());
                cell.setLength(0);
                rows.add(row);
                row = new ArrayList<>();
            } else if (c != '\r') {
                cell.append(c);
            }
        }
        if (!cell.isEmpty() || !row.isEmpty()) {
            row.add(cell.toString());
            rows.add(row);
        }
        return rows;
    }

    private static String cell(List<String> header, List<String> row, String name) {
        int index = header.indexOf(name);
        if (index < 0 || index >= row.size()) {
            return null;
        }
        String value = row.get(index);
        return value == null || value.isBlank() ? null : value;
    }

    private static List<String> splitCell(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(value.split("\\|"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }

    private static Boolean parseBool(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return "true".equalsIgnoreCase(value) || "1".equals(value) || "yes".equalsIgnoreCase(value);
    }
}
