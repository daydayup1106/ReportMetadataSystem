package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "app.llm")
@Getter
@Setter
public class LlmProperties {

    private String provider;          // ← app.llm.provider

    private Anthropic anthropic;      // ← app.llm.anthropic.*

    // nested class — maps to the nested YAML block
    @Getter
    @Setter
    public static class Anthropic {
        private String apiKey;        // ← app.llm.anthropic.api-key
        private String modelName;     // ← app.llm.anthropic.model-name
        private int maxTokens;        // ← app.llm.anthropic.max-tokens
        private double temperature;   // ← app.llm.anthropic.temperature
        private Duration timeout;     // ← app.llm.anthropic.timeout  ← "30s" auto-parses!
        private int maxRetries;       // ← app.llm.
    }
}
