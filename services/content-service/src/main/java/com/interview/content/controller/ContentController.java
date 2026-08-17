package com.interview.content.controller;

import com.interview.content.dto.ApiResponse;
import com.interview.content.dto.PageResponse;
import com.interview.content.dto.QuestionDetail;
import com.interview.content.dto.QuestionListItem;
import com.interview.content.model.Company;
import com.interview.content.model.Tag;
import com.interview.content.model.Topic;
import com.interview.content.service.CatalogService;
import com.interview.content.service.QuestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ContentController {

    private final QuestionService questionService;
    private final CatalogService catalogService;

    public ContentController(QuestionService questionService, CatalogService catalogService) {
        this.questionService = questionService;
        this.catalogService = catalogService;
    }

    @GetMapping("/questions")
    public ApiResponse<PageResponse<QuestionListItem>> questions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String sort
    ) {
        return ApiResponse.ok(questionService.search(type, difficulty, company, topic, tag, search, page, limit, sort, true));
    }

    @GetMapping("/questions/{id}")
    public ApiResponse<QuestionDetail> question(@PathVariable String id) {
        return ApiResponse.ok(questionService.getPublished(id));
    }

    @GetMapping("/questions/{id}/hints")
    public ApiResponse<Map<String, List<String>>> hints(@PathVariable String id) {
        return ApiResponse.ok(Map.of("hints", questionService.hints(id)));
    }

    @GetMapping("/companies")
    public ApiResponse<List<Company>> companies() {
        return ApiResponse.ok(catalogService.listCompanies());
    }

    @GetMapping("/companies/{id}")
    public ApiResponse<Company> company(@PathVariable String id) {
        return ApiResponse.ok(catalogService.getCompany(id));
    }

    @GetMapping("/topics")
    public ApiResponse<List<Topic>> topics(@RequestParam(required = false) String category) {
        return ApiResponse.ok(catalogService.listTopics(category));
    }

    @GetMapping("/topics/{id}")
    public ApiResponse<Topic> topic(@PathVariable String id) {
        return ApiResponse.ok(catalogService.getTopic(id));
    }

    @GetMapping("/tags")
    public ApiResponse<List<Tag>> tags() {
        return ApiResponse.ok(catalogService.listTags());
    }
}
