package com.interview.content.controller;

import com.interview.content.dto.ApiResponse;
import com.interview.content.dto.CompanyRequest;
import com.interview.content.dto.ContentStats;
import com.interview.content.dto.PageResponse;
import com.interview.content.dto.QuestionListItem;
import com.interview.content.dto.QuestionWriteRequest;
import com.interview.content.dto.TagRequest;
import com.interview.content.dto.TopicRequest;
import com.interview.content.model.Company;
import com.interview.content.model.Question;
import com.interview.content.model.Tag;
import com.interview.content.model.Topic;
import com.interview.content.service.CatalogService;
import com.interview.content.service.QuestionService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/v1")
public class InternalContentController {

    private final QuestionService questionService;
    private final CatalogService catalogService;

    public InternalContentController(QuestionService questionService, CatalogService catalogService) {
        this.questionService = questionService;
        this.catalogService = catalogService;
    }

    @GetMapping("/questions")
    public ApiResponse<PageResponse<QuestionListItem>> questions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ApiResponse.ok(questionService.search(type, null, null, null, null, search, page, limit, null, false));
    }

    @GetMapping("/questions/{id}")
    public ApiResponse<Question> question(@PathVariable String id) {
        return ApiResponse.ok(questionService.getRaw(id));
    }

    @PostMapping("/questions")
    public ApiResponse<Question> createQuestion(
            @RequestBody QuestionWriteRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String actorId
    ) {
        return ApiResponse.ok(questionService.create(request, actorId), "Question created");
    }

    @PutMapping("/questions/{id}")
    public ApiResponse<Question> updateQuestion(
            @PathVariable String id,
            @RequestBody QuestionWriteRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String actorId
    ) {
        return ApiResponse.ok(questionService.update(id, request, actorId));
    }

    @DeleteMapping("/questions/{id}")
    public ApiResponse<Void> deleteQuestion(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String actorId
    ) {
        questionService.delete(id, actorId);
        return ApiResponse.ok(null, "Deleted");
    }

    @PatchMapping("/questions/{id}/publish")
    public ApiResponse<Question> publish(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body,
            @RequestHeader(value = "X-User-Id", required = false) String actorId
    ) {
        boolean published = body.getOrDefault("published", true);
        return ApiResponse.ok(questionService.publish(id, published, actorId));
    }

    @GetMapping("/stats")
    public ApiResponse<ContentStats> stats() {
        return ApiResponse.ok(questionService.stats());
    }

    @PostMapping("/companies")
    public ApiResponse<Company> createCompany(@RequestBody CompanyRequest request) {
        return ApiResponse.ok(catalogService.createCompany(request), "Company created");
    }

    @PutMapping("/companies/{id}")
    public ApiResponse<Company> updateCompany(@PathVariable String id, @RequestBody CompanyRequest request) {
        return ApiResponse.ok(catalogService.updateCompany(id, request));
    }

    @DeleteMapping("/companies/{id}")
    public ApiResponse<Void> deleteCompany(@PathVariable String id) {
        catalogService.deleteCompany(id);
        return ApiResponse.ok(null, "Deleted");
    }

    @PostMapping("/topics")
    public ApiResponse<Topic> createTopic(@RequestBody TopicRequest request) {
        return ApiResponse.ok(catalogService.createTopic(request), "Topic created");
    }

    @PutMapping("/topics/{id}")
    public ApiResponse<Topic> updateTopic(@PathVariable String id, @RequestBody TopicRequest request) {
        return ApiResponse.ok(catalogService.updateTopic(id, request));
    }

    @DeleteMapping("/topics/{id}")
    public ApiResponse<Void> deleteTopic(@PathVariable String id) {
        catalogService.deleteTopic(id);
        return ApiResponse.ok(null, "Deleted");
    }

    @PostMapping("/tags")
    public ApiResponse<Tag> createTag(@RequestBody TagRequest request) {
        return ApiResponse.ok(catalogService.createTag(request), "Tag created");
    }

    @PutMapping("/tags/{id}")
    public ApiResponse<Tag> updateTag(@PathVariable String id, @RequestBody TagRequest request) {
        return ApiResponse.ok(catalogService.updateTag(id, request));
    }

    @DeleteMapping("/tags/{id}")
    public ApiResponse<Void> deleteTag(@PathVariable String id) {
        catalogService.deleteTag(id);
        return ApiResponse.ok(null, "Deleted");
    }

    @GetMapping("/companies")
    public ApiResponse<List<Company>> companies() {
        return ApiResponse.ok(catalogService.listCompanies());
    }

    @GetMapping("/topics")
    public ApiResponse<List<Topic>> topics() {
        return ApiResponse.ok(catalogService.listTopics(null));
    }

    @GetMapping("/tags")
    public ApiResponse<List<Tag>> tags() {
        return ApiResponse.ok(catalogService.listTags());
    }
}
