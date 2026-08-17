package com.interview.content.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "companies")
public class Company {
    @Id
    private String id;
    private String name;
    @Indexed(unique = true)
    private String slug;
    private String logo;
    private boolean active;
}
