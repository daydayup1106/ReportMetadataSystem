plugins {
    java
    id("org.springframework.boot") version "3.5.13"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.luoyu"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

// Version catalog — single place to manage all non-Spring versions
val langchain4jVersion = "1.12.2"
val milvusSdkVersion = "2.5.4"
val poiVersion = "5.3.0"
val minioVersion = "8.5.17"
val bucket4jVersion = "8.14.0"
val springDocVersion = "2.8.6"
val testcontainersVersion = "1.20.6"

dependencies {

    // ==================== Spring Boot Starters ====================
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // ==================== LangChain4j — AI Abstraction Layer ====================
    // Core: ChatLanguageModel interface, tool calling, memory abstractions
    implementation("dev.langchain4j:langchain4j:$langchain4jVersion")
    // Claude: primary LLM provider via Anthropic API
    implementation("dev.langchain4j:langchain4j-anthropic:$langchain4jVersion")
    // Claude: backup LLM provider via Anthropic API
    implementation("dev.langchain4j:langchain4j-open-ai:$langchain4jVersion")

    // ==================== Milvus — Direct SDK for advanced operations ====================
    // LangChain4j covers basic CRUD, but reindex jobs, collection management,
    // and hybrid search need the native SDK
    implementation("io.milvus:milvus-sdk-java:$milvusSdkVersion")

    // ==================== Excel Parsing ====================
    // Apache POI: parse .xlsx/.xls files from upload, generate example Excel
    implementation("org.apache.poi:poi-ooxml:$poiVersion")

    // ==================== File Storage ====================
    // MinIO SDK: store raw Excel files, export ZIP packages
    implementation("io.minio:minio:$minioVersion")

    // ==================== Rate Limiting ====================
    // Bucket4j: token-bucket rate limiting (upload: 5/min, batch: 3/min, chat: 10/min)
    implementation("com.bucket4j:bucket4j_jdk17-core:$bucket4jVersion")

    // ==================== API Documentation ====================
    // SpringDoc: auto-generated Swagger UI from annotations
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:$springDocVersion")

    // ==================== Lombok ====================
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")

    // ==================== Testing ====================
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // Testcontainers: run real MongoDB/Redis in tests, no mocks
    testImplementation(platform("org.testcontainers:testcontainers-bom:$testcontainersVersion"))
    testImplementation("org.testcontainers:testcontainers")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:mongodb")

    // WireMock: mock external HTTP services (embedding sidecar, Claude API) in tests
    testImplementation("org.wiremock:wiremock-standalone:3.13.0")

    // Awaitility: assert async operations in tests (reindex jobs, async validation)
    testImplementation("org.awaitility:awaitility:4.3.0")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
