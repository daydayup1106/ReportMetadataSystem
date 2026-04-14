package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "app.timeout")
@Getter
@Setter
public class TimeoutProperties {

    private Duration llm;
    private Duration embedding;
    private Duration database;
}
