package com.luoyu.report.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.milvus")
@Getter
@Setter
public class MilvusProperties {
    private String host;
    private int port;
    private String collectionName;
    private String indexType;
    private String metricType;
    private int searchTopK;
    private int rerankTopK;
}
