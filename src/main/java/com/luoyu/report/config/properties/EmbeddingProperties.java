package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
@Configuration
@ConfigurationProperties(prefix = "app.embedding")
@Getter
@Setter
public class EmbeddingProperties {

    private String baseUrl;           // ← base-url
    private String embedPath;         // ← embed-path
    private String rerankPath;        // ← rerank-path
    private Duration timeout;         // ← 10s → Duration
    private int maxRetries;
    private int dimension;            // 1024 for BGE-M3
    private Duration healthCacheTtl;  // ← 30s → Duration

}
