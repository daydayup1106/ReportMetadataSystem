package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.feature")
@Getter
@Setter
public class FeatureProperties {

    private boolean embeddingEnabled;
    private boolean rerankEnabled;
    private boolean aiValidationEnabled;
}
