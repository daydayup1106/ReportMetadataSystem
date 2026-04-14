package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "app.chat")
@Getter
@Setter
public class ChatProperties {

    private int shortTermMemorySize;
    private Duration sessionTtl;
    private int maxToolHops;
    private Duration sseHeartbeatInterval;
}
