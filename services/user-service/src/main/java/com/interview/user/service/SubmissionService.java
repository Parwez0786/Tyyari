package com.interview.user.service;

import com.interview.user.dto.PracticeProgress;
import com.interview.user.dto.SubmissionRequest;
import com.interview.user.dto.SubmissionResponse;
import com.interview.user.exception.ApiException;
import com.interview.user.exception.ErrorCode;
import com.interview.user.model.Submission;
import com.interview.user.model.SubmissionFile;
import com.interview.user.repository.SubmissionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class SubmissionService {

    private static final List<String> TRACKS = List.of("HLD", "LLD", "DSA", "FRONTEND", "CS");
    private static final int MAX_QUIZ_ANSWERS = 50;
    private static final int MAX_FILES = 40;
    private static final int MAX_FILE_CHARS = 400_000;
    private static final int MAX_NOTES_CHARS = 80_000;

    private final SubmissionRepository submissions;

    public SubmissionService(SubmissionRepository submissions) {
        this.submissions = submissions;
    }

    public SubmissionResponse upsert(String userId, SubmissionRequest request) {
        String questionId = requireText(request.questionId(), "questionId is required");
        String questionType = requireType(request.questionType());
        boolean oa = StringUtils.hasText(request.assessmentSetId());
        String scope = oa ? Submission.SCOPE_OA : Submission.SCOPE_PRACTICE;
        String setId = oa ? request.assessmentSetId().trim() : null;
        String uniqueKey = uniqueKey(userId, scope, questionId, setId);
        List<SubmissionFile> files = sanitizeFiles(request.files());
        Instant now = Instant.now();
        Submission current = submissions.findByUniqueKey(uniqueKey).orElseGet(() -> Submission.builder()
                .uniqueKey(uniqueKey)
                .userId(userId)
                .scope(scope)
                .questionId(questionId)
                .build());
        current.setQuestionType(questionType);
        current.setAssessmentSetId(setId);
        current.setLanguage(blankToNull(request.language()));
        current.setView(blankToNull(request.view()));
        current.setActiveId(blankToNull(request.activeId()));
        current.setStdin(request.stdin() == null ? "" : request.stdin());
        current.setFiles(files);
        current.setCanvas(request.canvas());
        current.setMath(clipNotes(request.math()));
        current.setExplanation(clipNotes(request.explanation()));
        current.setQuizScore(clipScore(request.quizScore()));
        current.setQuizTotal(clipScore(request.quizTotal()));
        current.setQuizAnswers(sanitizeQuizAnswers(request.quizAnswers()));
        current.setSubmittedAt(now);
        return SubmissionResponse.from(submissions.save(current));
    }

    public SubmissionResponse get(String userId, String questionId, String assessmentSetId) {
        String id = requireText(questionId, "questionId is required");
        boolean oa = StringUtils.hasText(assessmentSetId);
        String scope = oa ? Submission.SCOPE_OA : Submission.SCOPE_PRACTICE;
        String uniqueKey = uniqueKey(userId, scope, id, oa ? assessmentSetId.trim() : null);
        return submissions.findByUniqueKey(uniqueKey).map(SubmissionResponse::from).orElse(null);
    }

    public List<SubmissionResponse> listForAssessment(String userId, String assessmentSetId) {
        String setId = requireText(assessmentSetId, "assessmentSetId is required");
        return submissions.findByUserIdAndAssessmentSetIdOrderBySubmittedAtAsc(userId, setId).stream()
                .map(SubmissionResponse::from)
                .toList();
    }

    public PracticeProgress practiceProgress(String userId) {
        List<Submission> practice = submissions.findByUserIdAndScope(userId, Submission.SCOPE_PRACTICE);
        List<Submission> oa = submissions.findByUserIdAndScope(userId, Submission.SCOPE_OA);
        Map<String, Set<String>> idsByType = new LinkedHashMap<>();
        for (String type : TRACKS) {
            idsByType.put(type, new LinkedHashSet<>());
        }
        Set<String> allIds = new LinkedHashSet<>();
        Instant last = null;
        Submission latest = null;
        for (Submission item : practice) {
            if (!StringUtils.hasText(item.getQuestionId())) {
                continue;
            }
            allIds.add(item.getQuestionId());
            String type = item.getQuestionType() == null ? "" : item.getQuestionType().toUpperCase(Locale.ROOT);
            idsByType.computeIfAbsent(type, key -> new LinkedHashSet<>()).add(item.getQuestionId());
            last = later(last, item.getSubmittedAt());
            if (item.getSubmittedAt() != null && (latest == null || item.getSubmittedAt().isAfter(latest.getSubmittedAt()))) {
                latest = item;
            }
        }
        Set<String> oaKeys = new LinkedHashSet<>();
        for (Submission item : oa) {
            String key = StringUtils.hasText(item.getUniqueKey()) ? item.getUniqueKey() : item.getQuestionId();
            if (StringUtils.hasText(key)) {
                oaKeys.add(key);
            }
            last = later(last, item.getSubmittedAt());
            if (item.getSubmittedAt() != null && (latest == null || latest.getSubmittedAt() == null || item.getSubmittedAt().isAfter(latest.getSubmittedAt()))) {
                latest = item;
            }
        }
        List<PracticeProgress.TypeCount> byType = TRACKS.stream()
                .map(type -> new PracticeProgress.TypeCount(type, idsByType.getOrDefault(type, Set.of()).size()))
                .toList();
        Set<LocalDate> activeDays = new HashSet<>();
        Set<String> todayIds = new LinkedHashSet<>();
        Set<String> weekIds = new LinkedHashSet<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate weekStart = today.minusDays(6);
        for (Submission item : practice) {
            LocalDate day = dayOf(item.getSubmittedAt());
            if (day == null) {
                continue;
            }
            activeDays.add(day);
            if (StringUtils.hasText(item.getQuestionId()) && !day.isBefore(weekStart)) {
                weekIds.add(item.getQuestionId());
            }
            if (day.equals(today) && StringUtils.hasText(item.getQuestionId())) {
                todayIds.add(item.getQuestionId());
            }
        }
        for (Submission item : oa) {
            LocalDate day = dayOf(item.getSubmittedAt());
            if (day != null) {
                activeDays.add(day);
            }
        }
        return new PracticeProgress(
                allIds.size(),
                List.copyOf(allIds),
                byType,
                oaKeys.size(),
                last,
                streakDays(activeDays, today),
                todayIds.size(),
                weekIds.size(),
                latest == null ? null : latest.getQuestionId(),
                latest == null ? null : latest.getQuestionType(),
                latest == null ? null : latest.getView(),
                weekActive(activeDays, today)
        );
    }

    private LocalDate dayOf(Instant instant) {
        return instant == null ? null : instant.atZone(ZoneOffset.UTC).toLocalDate();
    }

    private int streakDays(Set<LocalDate> days, LocalDate today) {
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (days.contains(cursor)) {
            streak += 1;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private List<Boolean> weekActive(Set<LocalDate> days, LocalDate today) {
        List<Boolean> week = new ArrayList<>(7);
        for (int i = 6; i >= 0; i--) {
            week.add(days.contains(today.minusDays(i)));
        }
        return week;
    }

    private Instant later(Instant current, Instant candidate) {
        if (candidate == null) {
            return current;
        }
        if (current == null || candidate.isAfter(current)) {
            return candidate;
        }
        return current;
    }

    static String uniqueKey(String userId, String scope, String questionId, String assessmentSetId) {
        if (Submission.SCOPE_OA.equals(scope)) {
            return userId + "|OA|" + assessmentSetId + "|" + questionId;
        }
        return userId + "|P|" + questionId;
    }

    private List<SubmissionFile> sanitizeFiles(List<SubmissionRequest.SubmissionFileDto> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        if (files.size() > MAX_FILES) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Too many files", HttpStatus.BAD_REQUEST);
        }
        return files.stream().map(file -> {
            String content = file.content() == null ? "" : file.content();
            if (content.length() > MAX_FILE_CHARS) {
                throw new ApiException(ErrorCode.VALIDATION_ERROR, "A file is too large", HttpStatus.BAD_REQUEST);
            }
            String name = file.name() == null ? "file" : file.name();
            return SubmissionFile.builder()
                    .id(file.id())
                    .type(StringUtils.hasText(file.type()) ? file.type() : "file")
                    .name(name)
                    .content(content)
                    .build();
        }).toList();
    }

    private String requireType(String type) {
        String value = requireText(type, "questionType is required").toUpperCase(Locale.ROOT);
        if (!TRACKS.contains(value)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Unsupported question type", HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private String requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST);
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String clipNotes(String value) {
        String text = value == null ? "" : value;
        if (text.length() > MAX_NOTES_CHARS) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Notes are too long", HttpStatus.BAD_REQUEST);
        }
        return text;
    }

    private Integer clipScore(Integer value) {
        if (value == null) {
            return null;
        }
        return Math.max(0, Math.min(value, MAX_QUIZ_ANSWERS));
    }

    private List<Integer> sanitizeQuizAnswers(List<Integer> answers) {
        if (answers == null || answers.isEmpty()) {
            return List.of();
        }
        if (answers.size() > MAX_QUIZ_ANSWERS) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Too many quiz answers", HttpStatus.BAD_REQUEST);
        }
        return answers.stream().map(item -> item == null ? -1 : item).toList();
    }
}
