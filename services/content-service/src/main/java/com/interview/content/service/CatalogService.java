package com.interview.content.service;

import com.interview.content.dto.CompanyRequest;
import com.interview.content.dto.TagRequest;
import com.interview.content.dto.TopicRequest;
import com.interview.content.event.ContentEventPublisher;
import com.interview.content.exception.ApiException;
import com.interview.content.exception.ErrorCode;
import com.interview.content.model.Company;
import com.interview.content.model.Tag;
import com.interview.content.model.Topic;
import com.interview.content.repository.CompanyRepository;
import com.interview.content.repository.TagRepository;
import com.interview.content.repository.TopicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Service
public class CatalogService {
    private final CompanyRepository companies;
    private final TopicRepository topics;
    private final TagRepository tags;
    private final ContentCache cache;
    private final ContentEventPublisher events;

    public CatalogService(
            CompanyRepository companies,
            TopicRepository topics,
            TagRepository tags,
            ContentCache cache,
            ContentEventPublisher events
    ) {
        this.companies = companies;
        this.topics = topics;
        this.tags = tags;
        this.cache = cache;
        this.events = events;
    }

    public List<Company> listCompanies() {
        List<Company> cached = cache.getCompanies();
        if (cached != null) {
            return cached;
        }
        List<Company> all = companies.findAll();
        cache.putCompanies(all);
        return all;
    }

    public Company getCompany(String idOrSlug) {
        return companies.findById(idOrSlug)
                .or(() -> companies.findBySlug(idOrSlug))
                .orElseThrow(() -> new ApiException(ErrorCode.COMPANY_NOT_FOUND, "Company not found", HttpStatus.NOT_FOUND));
    }

    public Company createCompany(CompanyRequest req) {
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : Slugs.from(req.name());
        Company saved = companies.save(Company.builder()
                .name(req.name())
                .slug(slug)
                .logo(req.logo())
                .active(req.active() == null || req.active())
                .build());
        cache.evictCompanies();
        events.publish("COMPANY_CREATED", saved.getId(), Map.of("slug", saved.getSlug()));
        return saved;
    }

    public Company updateCompany(String id, CompanyRequest req) {
        Company company = getCompany(id);
        if (req.name() != null) company.setName(req.name());
        if (req.slug() != null) company.setSlug(Slugs.from(req.slug()));
        if (req.logo() != null) company.setLogo(req.logo());
        if (req.active() != null) company.setActive(req.active());
        Company saved = companies.save(company);
        cache.evictCompanies();
        return saved;
    }

    public void deleteCompany(String id) {
        if (!companies.existsById(id)) {
            throw new ApiException(ErrorCode.COMPANY_NOT_FOUND, "Company not found", HttpStatus.NOT_FOUND);
        }
        companies.deleteById(id);
        cache.evictCompanies();
    }

    public List<Topic> listTopics(String category) {
        List<Topic> cached = cache.getTopics(category);
        if (cached != null) {
            return cached;
        }
        List<Topic> all = StringUtils.hasText(category) ? topics.findByCategory(category) : topics.findAll();
        cache.putTopics(category, all);
        return all;
    }

    public Topic getTopic(String idOrSlug) {
        return topics.findById(idOrSlug)
                .or(() -> topics.findBySlug(idOrSlug))
                .orElseThrow(() -> new ApiException(ErrorCode.TOPIC_NOT_FOUND, "Topic not found", HttpStatus.NOT_FOUND));
    }

    public Topic createTopic(TopicRequest req) {
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : Slugs.from(req.name());
        Topic saved = topics.save(Topic.builder().name(req.name()).slug(slug).category(req.category()).build());
        cache.evictTopics();
        return saved;
    }

    public Topic updateTopic(String id, TopicRequest req) {
        Topic topic = getTopic(id);
        if (req.name() != null) topic.setName(req.name());
        if (req.slug() != null) topic.setSlug(Slugs.from(req.slug()));
        if (req.category() != null) topic.setCategory(req.category());
        Topic saved = topics.save(topic);
        cache.evictTopics();
        return saved;
    }

    public void deleteTopic(String id) {
        if (!topics.existsById(id)) {
            throw new ApiException(ErrorCode.TOPIC_NOT_FOUND, "Topic not found", HttpStatus.NOT_FOUND);
        }
        topics.deleteById(id);
        cache.evictTopics();
    }

    public List<Tag> listTags() {
        List<Tag> cached = cache.getTags();
        if (cached != null) {
            return cached;
        }
        List<Tag> all = tags.findAll();
        cache.putTags(all);
        return all;
    }

    public Tag createTag(TagRequest req) {
        String slug = StringUtils.hasText(req.slug()) ? Slugs.from(req.slug()) : Slugs.from(req.name());
        Tag saved = tags.save(Tag.builder().name(req.name()).slug(slug).build());
        cache.evictTags();
        return saved;
    }

    public Tag updateTag(String id, TagRequest req) {
        Tag tag = tags.findById(id).orElseThrow(() -> new ApiException(ErrorCode.TAG_NOT_FOUND, "Tag not found", HttpStatus.NOT_FOUND));
        if (req.name() != null) tag.setName(req.name());
        if (req.slug() != null) tag.setSlug(Slugs.from(req.slug()));
        Tag saved = tags.save(tag);
        cache.evictTags();
        return saved;
    }

    public void deleteTag(String id) {
        if (!tags.existsById(id)) {
            throw new ApiException(ErrorCode.TAG_NOT_FOUND, "Tag not found", HttpStatus.NOT_FOUND);
        }
        tags.deleteById(id);
        cache.evictTags();
    }
}
