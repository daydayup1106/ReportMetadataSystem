package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "app.rate-limit")
@Getter
@Setter
public class RateLimitProperties {

    private Bucket upload;
    private Bucket batch;
    private Bucket chat;

    @Getter
    @Setter
    public static class Bucket {
        private int capacity;
        private int refillTokens;
        private Duration refillDuration;
    }
}
