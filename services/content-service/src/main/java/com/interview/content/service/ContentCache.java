package com.interview.content.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.content.model.Company;
import com.interview.content.model.Question;
import com.interview.content.model.Tag;
import com.interview.content.model.Topic;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Service
public class ContentCache {
    private static final Logger log = LoggerFactory.getLogger(ContentCache.class);
    private static final Duration QUESTION_TTL = Duration.ofMinutes(30);
    private static final Duration META_TTL = Duration.ofHours(6);

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public ContentCache(StringRedisTemplate redis, ObjectMapper mapper) {
        this.redis = redis;
        this.mapper = mapper;
    }

    public Question getQuestion(String id) {
        return read("question:" + id, Question.class);
    }

    public void putQuestion(Question question) {
        write("question:" + question.getId(), question, QUESTION_TTL);
    }

    public void evictQuestion(String id) {
        redis.delete("question:" + id);
    }

    public List<Company> getCompanies() {
        return readList("companies:all", new TypeReference<>() {});
    }

    public void putCompanies(List<Company> companies) {
        write("companies:all", companies, META_TTL);
    }

    public void evictCompanies() {
        redis.delete("companies:all");
    }

    public List<Topic> getTopics(String category) {
        String key = category == null || category.isBlank() ? "topics:all" : "topics:" + category;
        return readList(key, new TypeReference<>() {});
    }

    public void putTopics(String category, List<Topic> topics) {
        String key = category == null || category.isBlank() ? "topics:all" : "topics:" + category;
        write(key, topics, META_TTL);
    }

    public void evictTopics() {
        redis.delete("topics:all");
        Set<String> keys = redis.keys("topics:*");
        if (keys != null) {
            keys.forEach(redis::delete);
        }
    }

    public List<Tag> getTags() {
        return readList("tags:all", new TypeReference<>() {});
    }

    public void putTags(List<Tag> tags) {
        write("tags:all", tags, META_TTL);
    }

    public void evictTags() {
        redis.delete("tags:all");
    }

    private <T> T read(String key, Class<T> type) {
        try {
            String json = redis.opsForValue().get(key);
            return json == null ? null : mapper.readValue(json, type);
        } catch (Exception e) {
            log.warn("Cache read failed for {}", key);
            return null;
        }
    }

    private <T> List<T> readList(String key, TypeReference<List<T>> type) {
        try {
            String json = redis.opsForValue().get(key);
            return json == null ? null : mapper.readValue(json, type);
        } catch (Exception e) {
            log.warn("Cache read failed for {}", key);
            return null;
        }
    }

    private void write(String key, Object value, Duration ttl) {
        try {
            redis.opsForValue().set(key, mapper.writeValueAsString(value), ttl);
        } catch (Exception e) {
            log.warn("Cache write failed for {}", key);
        }
    }
}
