package com.interview.content.config;

import com.interview.content.model.Company;
import com.interview.content.model.Example;
import com.interview.content.model.Question;
import com.interview.content.model.Tag;
import com.interview.content.model.Topic;
import com.interview.content.repository.CompanyRepository;
import com.interview.content.repository.QuestionRepository;
import com.interview.content.repository.TagRepository;
import com.interview.content.repository.TopicRepository;
import com.interview.content.service.ContentCache;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class DataSeeder implements ApplicationRunner {

    private final CompanyRepository companies;
    private final TopicRepository topics;
    private final TagRepository tags;
    private final QuestionRepository questions;
    private final ContentCache cache;

    public DataSeeder(
            CompanyRepository companies,
            TopicRepository topics,
            TagRepository tags,
            QuestionRepository questions,
            ContentCache cache
    ) {
        this.companies = companies;
        this.topics = topics;
        this.tags = tags;
        this.questions = questions;
        this.cache = cache;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedCompany("Amazon", "amazon");
        seedCompany("Google", "google");
        seedCompany("Microsoft", "microsoft");
        seedCompany("Meta", "meta");
        seedCompany("Uber", "uber");
        seedCompany("Netflix", "netflix");
        seedCompany("Airbnb", "airbnb");
        seedCompany("LinkedIn", "linkedin");

        seedTopic("Arrays", "arrays", "DSA");
        seedTopic("Hashing", "hashing", "DSA");
        seedTopic("Trees", "trees", "DSA");
        seedTopic("Dynamic Programming", "dp", "DSA");
        seedTopic("Distributed Systems", "distributed-systems", "HLD");
        seedTopic("Caching", "caching", "HLD");
        seedTopic("OOP", "oop", "LLD");
        seedTopic("Design Patterns", "design-patterns", "LLD");
        seedTopic("Indexing", "indexing", "CS");
        seedTopic("React", "react", "FRONTEND");
        seedTopic("Online Assessment", "oa", "OA");

        seedTag("Array");
        seedTag("HashMap");
        seedTag("Scalability");
        seedTag("Factory");
        seedTag("Strategy");
        seedTag("Binary Search");

        seedQuestion(
                "DSA", null, "Two Sum", "two-sum", "EASY",
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                List.of("Arrays", "Hashing"), List.of("Amazon", "Google"), List.of("Array", "HashMap"),
                List.of("2 <= nums.length <= 10^5"),
                List.of(new Example("[2,7,11,15], target=9", "[0,1]", "2 + 7 = 9")),
                List.of("Think about the complement of each number.", "A hash map gives O(n) time.")
        );
        seedQuestion(
                "HLD", null, "Design URL Shortener", "design-url-shortener", "MEDIUM",
                "Design a service like bit.ly that shortens long URLs and redirects with low latency at high scale.",
                List.of("Distributed Systems", "Caching"), List.of("Amazon", "Google"), List.of("Scalability"),
                List.of("100M new URLs / month", "Read:write ~ 100:1"),
                List.of(new Example("https://example.com/very/long", "https://tyy.ari/ab12cd", null)),
                List.of("Separate write path (encode) from read path (redirect).", "Cache hot redirects.")
        );
        seedQuestion(
                "LLD", null, "Design Parking Lot", "design-parking-lot", "MEDIUM",
                "Design a parking lot system that supports multiple floors, vehicle types, and ticketing.",
                List.of("OOP", "Design Patterns"), List.of("Amazon"), List.of("Factory", "Strategy"),
                List.of("Multiple floors", "Cars, bikes, trucks"),
                List.of(),
                List.of("Model Vehicle, Spot, Ticket, and ParkingLot as first-class types.")
        );
        seedQuestion(
                "CS", "DBMS", "What is database indexing?", "what-is-database-indexing", "EASY",
                "Explain what an index is, how B-Trees help lookups, and the write trade-off.",
                List.of("Indexing"), List.of("Microsoft"), List.of(),
                List.of(),
                List.of(),
                List.of("Compare a full table scan with a B-Tree lookup.")
        );
        seedQuestion(
                "FRONTEND", null, "Explain React reconciliation", "explain-react-reconciliation", "MEDIUM",
                "Describe how React decides which DOM nodes to update, including keys and the virtual DOM.",
                List.of("React"), List.of("Meta"), List.of(),
                List.of(),
                List.of(),
                List.of("Keys should be stable, not array indexes for dynamic lists.")
        );
        seedQuestion(
                "OA", null, "Minimum window covering required characters", "minimum-window-cover", "HARD",
                "Given strings s and t, return the smallest window in s which contains all characters of t.",
                List.of("Arrays", "Hashing"), List.of("Uber", "Google"), List.of("Array"),
                List.of("1 <= s.length, t.length <= 10^5"),
                List.of(new Example("s=ADOBECODEBANC t=ABC", "BANC", null)),
                List.of("Sliding window plus a need-count map.")
        );

        seedQuestion("HLD", null, "Design a URL Shortener (TinyURL)", "design-tinyurl", "EASY",
                "Design a service that converts long URLs into short, unique links and redirects with very low latency.",
                List.of("Distributed Systems", "Caching"), List.of("Google", "Meta", "Amazon", "Microsoft"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design Instagram", "design-instagram", "MEDIUM",
                "Design a photo-sharing platform with feeds, stories, likes, and fan-out at scale.",
                List.of("Distributed Systems"), List.of("Meta", "Google"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design a Rate Limiter", "design-rate-limiter", "MEDIUM",
                "Build a distributed rate limiter that protects APIs from bursts while staying fair across users.",
                List.of("Distributed Systems", "Caching"), List.of("Amazon", "Google", "Uber", "Airbnb"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design a Notification System", "design-notification-system", "MEDIUM",
                "Design push, email, and in-app notifications with retries, preferences, and high throughput.",
                List.of("Distributed Systems"), List.of("Uber", "Amazon", "LinkedIn"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design Twitter", "design-twitter", "MEDIUM",
                "Design a real-time timeline with tweets, follows, and celebrity fan-out.",
                List.of("Distributed Systems", "Caching"), List.of("Meta", "Amazon", "Google"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design a Chat System (WhatsApp)", "design-chat-system", "HARD",
                "Design 1:1 and group messaging with delivery receipts, media, and presence.",
                List.of("Distributed Systems"), List.of("Meta", "Google", "Microsoft"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design YouTube (Video Streaming)", "design-youtube", "HARD",
                "Design video upload, transcoding, CDN delivery, and recommendations.",
                List.of("Distributed Systems"), List.of("Google", "Netflix", "Amazon"), List.of("Scalability"),
                List.of(), List.of(), List.of(), true);
        seedQuestion("HLD", null, "Design Netflix (Video Streaming)", "design-netflix", "HARD",
                "Design a streaming catalog with adaptive bitrate, CDN, and personalized home rows.",
                List.of("Distributed Systems", "Caching"), List.of("Netflix", "Amazon", "Google"), List.of("Scalability"),
                List.of(), List.of(), List.of());
        seedQuestion("HLD", null, "Design Google Drive", "design-google-drive", "HARD",
                "Design file storage with sync, sharing, versioning, and conflict resolution.",
                List.of("Distributed Systems"), List.of("Google", "Microsoft", "Dropbox"), List.of("Scalability"),
                List.of(), List.of(), List.of(), true);
        seedQuestion("HLD", null, "Design a Web Crawler", "design-web-crawler", "MEDIUM",
                "Design a polite, scalable crawler that discovers pages and stores them for search.",
                List.of("Distributed Systems"), List.of("Google", "Microsoft"), List.of("Scalability"),
                List.of(), List.of(), List.of());

        seedQuestion("LLD", null, "Design BookMyShow", "design-bookmyshow", "MEDIUM",
                "Model movies, shows, seats, and concurrent booking without double-selling a seat.",
                List.of("OOP", "Design Patterns"), List.of("Amazon", "Uber"), List.of("Factory"),
                List.of(), List.of(), List.of());
        seedQuestion("LLD", null, "Design Splitwise", "design-splitwise", "MEDIUM",
                "Design expense splitting with groups, simplify-debts, and activity history.",
                List.of("OOP"), List.of("Uber", "Google"), List.of("Strategy"),
                List.of(), List.of(), List.of());
        seedQuestion("LLD", null, "Design an LRU Cache", "design-lru-cache-lld", "MEDIUM",
                "Implement get/put in O(1) with eviction of the least recently used key.",
                List.of("OOP"), List.of("Amazon", "Google", "Microsoft"), List.of(),
                List.of(), List.of(), List.of());
        seedQuestion("LLD", null, "Design an Elevator System", "design-elevator", "HARD",
                "Model elevators, floors, requests, and a dispatcher that minimizes wait time.",
                List.of("OOP", "Design Patterns"), List.of("Amazon", "Microsoft"), List.of("Strategy"),
                List.of(), List.of(), List.of(), true);
        seedQuestion("LLD", null, "Design Snake Game", "design-snake-game", "EASY",
                "Design the board, snake movement, food, and collision rules as objects.",
                List.of("OOP"), List.of("Amazon", "Google"), List.of(),
                List.of(), List.of(), List.of());
        seedQuestion("LLD", null, "Design a Logging Framework", "design-logger", "MEDIUM",
                "Build a logger with levels, formatters, and pluggable appenders.",
                List.of("OOP", "Design Patterns"), List.of("Uber", "Microsoft"), List.of("Strategy"),
                List.of(), List.of(), List.of());

        seedQuestion("DSA", null, "Longest Substring Without Repeating Characters", "longest-substring", "MEDIUM",
                "Find the length of the longest substring without repeating characters.",
                List.of("Arrays", "Hashing"), List.of("Amazon", "Google", "Meta"), List.of("Array", "HashMap"),
                List.of(), List.of(), List.of());
        seedQuestion("DSA", null, "Merge Intervals", "merge-intervals", "MEDIUM",
                "Given overlapping intervals, merge them into a set of non-overlapping ranges.",
                List.of("Arrays"), List.of("Meta", "Google", "Microsoft"), List.of("Array"),
                List.of(), List.of(), List.of());
        seedQuestion("DSA", null, "Number of Islands", "number-of-islands", "MEDIUM",
                "Count islands in a grid of water and land using DFS or BFS.",
                List.of("Arrays"), List.of("Amazon", "Google", "Meta"), List.of("Array"),
                List.of(), List.of(), List.of());
        seedQuestion("DSA", null, "Word Search", "word-search", "MEDIUM",
                "Search for a word on a 2D board by walking adjacent cells without reuse.",
                List.of("Arrays"), List.of("Microsoft", "Amazon"), List.of("Array"),
                List.of(), List.of(), List.of());
        seedQuestion("DSA", null, "Trapping Rain Water", "trapping-rain-water", "HARD",
                "Compute how much water a height map can trap after raining.",
                List.of("Arrays"), List.of("Amazon", "Google", "Meta"), List.of("Array"),
                List.of(), List.of(), List.of(), true);
        seedQuestion("DSA", null, "Binary Search", "binary-search", "EASY",
                "Find a target in a sorted array in O(log n) time.",
                List.of("Arrays"), List.of("Google", "Amazon"), List.of("Binary Search"),
                List.of(), List.of(), List.of());

        seedQuestion("FRONTEND", null, "Build a Todo App", "build-todo-app", "EASY",
                "Build a todo list with add, complete, filter, and persist in local state.",
                List.of("React"), List.of("Meta", "Uber"), List.of(),
                List.of(), List.of(), List.of());
        seedQuestion("FRONTEND", null, "Infinite Scroll Feed", "infinite-scroll-feed", "MEDIUM",
                "Render a social feed that loads more posts as the user scrolls.",
                List.of("React"), List.of("Meta", "LinkedIn"), List.of(),
                List.of(), List.of(), List.of());
        seedQuestion("FRONTEND", null, "Pixel-perfect Pricing Table", "pricing-table", "HARD",
                "Recreate a responsive pricing table with monthly/yearly toggle.",
                List.of("React"), List.of("Airbnb", "Uber"), List.of(),
                List.of(), List.of(), List.of(), true);

        seedQuestion("CS", "OS", "What is virtual memory?", "what-is-virtual-memory", "EASY",
                "Explain paging, page faults, and why virtual memory lets processes exceed RAM.",
                List.of("Indexing"), List.of("Microsoft", "Amazon"), List.of(),
                List.of(), List.of(), List.of());
        seedQuestion("CS", "NETWORKS", "TCP vs UDP", "tcp-vs-udp", "EASY",
                "Compare reliability, ordering, and use-cases for TCP and UDP.",
                List.of("Indexing"), List.of("Google", "Cisco"), List.of(),
                List.of(), List.of(), List.of());
        seedQuestion("OA", null, "Two Sum unique pairs", "two-sum-oa", "EASY",
                "Count unique pairs that add up to a target in an OA-style timed round.",
                List.of("Arrays", "Hashing"), List.of("Amazon", "Uber"), List.of("Array"),
                List.of(), List.of(), List.of());

        seedHldRequirements();
    }

    private void seedHldRequirements() {
        ensureRequirements(
                "design-url-shortener",
                List.of(
                        "Users can convert a long URL into a short unique link",
                        "Visiting the short link redirects to the original URL",
                        "Optional custom aliases and expiry on short links"
                ),
                List.of(
                        "Redirects should complete in a few milliseconds",
                        "100M new URLs / month with a read:write ratio around 100:1",
                        "Short links must persist for the configured duration"
                )
        );
        ensureRequirements(
                "design-tinyurl",
                List.of(
                        "Generate a short unique code for a long URL",
                        "Redirect the short code to the original URL",
                        "Prevent duplicate codes and support analytics on clicks"
                ),
                List.of(
                        "Redirect p99 under 50ms",
                        "Highly available read path for viral links",
                        "Codes must be unique globally"
                )
        );
        ensureRequirements(
                "design-instagram",
                List.of(
                        "Users can upload photos, follow others, and like or comment",
                        "Home feed shows posts from followed accounts",
                        "Stories expire after 24 hours"
                ),
                List.of(
                        "Feed can be eventually consistent",
                        "Store petabytes of media",
                        "Feed load stays fast for millions of daily active users"
                )
        );
        ensureRequirements(
                "design-rate-limiter",
                List.of(
                        "Limit requests per user, IP, or API key in a time window",
                        "Support different limits per endpoint",
                        "Reject excess traffic with HTTP 429"
                ),
                List.of(
                        "Allow/deny decision in under 5ms",
                        "Counts stay accurate across a fleet of servers",
                        "Fail closed or with a safe default if the limiter store is down"
                )
        );
        ensureRequirements(
                "design-notification-system",
                List.of(
                        "Send email, SMS, and push notifications",
                        "Honor user preferences and quiet hours",
                        "Retry failed deliveries without double-sending"
                ),
                List.of(
                        "Millions of notifications per minute",
                        "At-least-once delivery with idempotency keys",
                        "Channel-specific latency SLAs"
                )
        );
        ensureRequirements(
                "design-twitter",
                List.of(
                        "Post tweets, follow users, and like posts",
                        "Home timeline and per-user timeline",
                        "Search recent tweets"
                ),
                List.of(
                        "Home timeline p99 under 200ms",
                        "Celebrity fan-out without hot partitions",
                        "Highly available writes during spikes"
                )
        );
        ensureRequirements(
                "design-chat-system",
                List.of(
                        "1:1 and group messaging",
                        "Delivery and read receipts",
                        "Media sharing and online presence"
                ),
                List.of(
                        "Messages stay ordered per conversation",
                        "In-region delivery under 100ms",
                        "Hundreds of millions of daily active users"
                )
        );
        ensureRequirements(
                "design-youtube",
                List.of(
                        "Upload, transcode, and play videos",
                        "Comments, likes, and subscriptions",
                        "Search and personalized recommendations"
                ),
                List.of(
                        "Adaptive bitrate via CDN",
                        "Transcoding is asynchronous",
                        "99.99% playback availability"
                )
        );
        ensureRequirements(
                "design-netflix",
                List.of(
                        "Browse the catalog and play titles",
                        "Profiles and continue-watching",
                        "Personalized home rows"
                ),
                List.of(
                        "Playback start under 2 seconds",
                        "High CDN hit ratio",
                        "Regional catalog restrictions are enforced"
                )
        );
        ensureRequirements(
                "design-google-drive",
                List.of(
                        "Upload, download, and organize files and folders",
                        "Share with view or edit access",
                        "Keep version history"
                ),
                List.of(
                        "Conflict resolution for concurrent edits",
                        "Durable replicated storage",
                        "Sync across devices with low lag"
                )
        );
        ensureRequirements(
                "design-web-crawler",
                List.of(
                        "Discover URLs, fetch pages, and store content",
                        "Respect robots.txt",
                        "Recrawl pages as they change"
                ),
                List.of(
                        "Polite per-host rate limits",
                        "Scale to billions of pages",
                        "Balance freshness against crawl budget"
                )
        );
    }

    private void ensureRequirements(String slug, List<String> functional, List<String> nonFunctional) {
        questions.findBySlug(slug).ifPresent(question -> {
            boolean missingFr = question.getFunctionalRequirements() == null || question.getFunctionalRequirements().isEmpty();
            boolean missingNfr = question.getNonFunctionalRequirements() == null || question.getNonFunctionalRequirements().isEmpty();
            if (!missingFr && !missingNfr) {
                return;
            }
            if (missingFr) {
                question.setFunctionalRequirements(functional);
            }
            if (missingNfr) {
                question.setNonFunctionalRequirements(nonFunctional);
            }
            question.setUpdatedAt(Instant.now());
            questions.save(question);
            cache.evictQuestion(question.getId());
        });
    }

    private void seedCompany(String name, String slug) {
        if (!companies.existsBySlug(slug)) {
            companies.save(Company.builder().name(name).slug(slug).active(true).build());
        }
    }

    private void seedTopic(String name, String slug, String category) {
        if (!topics.existsBySlug(slug)) {
            topics.save(Topic.builder().name(name).slug(slug).category(category).build());
        }
    }

    private void seedTag(String name) {
        String slug = name.toLowerCase().replace(' ', '-');
        if (!tags.existsBySlug(slug)) {
            tags.save(Tag.builder().name(name).slug(slug).build());
        }
    }

    private void seedQuestion(
            String type, String subType, String title, String slug, String difficulty,
            String description, List<String> topicNames, List<String> companyNames, List<String> tagNames,
            List<String> constraints, List<Example> examples, List<String> hints
    ) {
        seedQuestion(type, subType, title, slug, difficulty, description, topicNames, companyNames, tagNames, constraints, examples, hints, false);
    }

    private void seedQuestion(
            String type, String subType, String title, String slug, String difficulty,
            String description, List<String> topicNames, List<String> companyNames, List<String> tagNames,
            List<String> constraints, List<Example> examples, List<String> hints, boolean premium
    ) {
        if (questions.existsBySlug(slug)) {
            return;
        }
        Instant now = Instant.now();
        questions.save(Question.builder()
                .type(type)
                .subType(subType)
                .title(title)
                .slug(slug)
                .description(description)
                .difficulty(difficulty)
                .topics(topicNames)
                .companies(companyNames)
                .tags(tagNames)
                .constraints(constraints)
                .examples(examples)
                .hints(hints)
                .published(true)
                .premium(premium)
                .createdBy("seed")
                .createdAt(now)
                .updatedAt(now)
                .build());
    }
}
