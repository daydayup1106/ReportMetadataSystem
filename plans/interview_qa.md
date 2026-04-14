# Interview Q&A Record

This document tracks key design decisions, implementation choices, and their rationale throughout the project. Each entry is a potential interview question with a production-grade answer.

---

## Architecture & Design Decisions

### Q1: Why did you choose MongoDB over PostgreSQL for this project?

**Answer:**
The core domain model is document-oriented. A report is a self-contained aggregate with nested columns, parameters, roles, config, and UI settings. With PostgreSQL, one report query becomes 6+ JOINs across normalized tables. With MongoDB, it's one document read.

Key factors:
- No cross-entity JOINs — reports don't reference each other
- Schema flexibility — Excel files have varying header formats, optional fields
- Version snapshots are trivial — just save the entire document
- Atomic document updates — modify a report and its children in one operation

If the interviewer pushes: "MongoDB doesn't mean no structure. I use Spring Data MongoDB with `@Document` annotations, unique indexes, compound indexes, text indexes, and TTL indexes. The schema is enforced at the application layer, not the database layer."

---

### Q2: Why Milvus instead of Qdrant, Pinecone, or pgvector?

**Answer:**
Three reasons specific to this project:

1. **Native hybrid search** — Milvus has first-class support for both dense and sparse vectors in the same collection. BGE-M3 produces both outputs, and Milvus can fuse them with Reciprocal Rank Fusion. Qdrant's sparse support is newer and less battle-tested.

2. **BGE-M3 ecosystem alignment** — Both Milvus and BGE-M3 come from the Chinese AI ecosystem (Zilliz and BAAI). They're extensively tested together with production-validated configurations.

3. **Scale ceiling** — Milvus handles billions of vectors. While my current dataset is small, the architecture doesn't need to be redesigned when it grows.

Why not pgvector: Adding vector search to PostgreSQL couples two different workloads (OLTP + vector search) with different scaling characteristics. Separating them gives independent scaling and failure isolation.

---

### Q3: Why a modular monolith instead of microservices?

**Answer:**
Single domain (report metadata), single database, tightly coupled upload pipeline (parse → validate → save happens in one request), and single developer. Microservices would force distributed transactions across the upload pipeline, add service mesh overhead, and multiply operational complexity — all for ~20 endpoints.

The monolith is modular: clean package boundaries, interface-based extension points. If the chat/RAG workload needs independent scaling later, I can extract it into a separate service because the boundaries are already clean.

Key principle: "Monolith first, modularize well, extract when proven necessary."

---

### Q4: Why LangChain4j instead of Spring AI?

**Answer:**
Flexibility. Spring AI is opinionated — it hides retrieval pipeline details behind advisors. LangChain4j exposes every knob:

- I can customize retrieval strategies (dense vs hybrid vs sparse)
- I can swap rerankers independently
- I can tune memory window size vs summarization
- Tool calling with `@Tool` annotations is more mature

Spring AI's advisor pattern is elegant for simple use cases, but when you need to tune RAG quality — adjust chunking strategies, experiment with reranking thresholds, implement citation gates — LangChain4j gives granular control.

Both integrate with Spring Boot via starters. LangChain4j's flexibility doesn't mean losing Spring's infrastructure benefits.

---

### Q5: Why did you separate the embedding service as a sidecar instead of running ONNX in-process?

**Answer:**
Four reasons:

1. **Different scaling characteristics** — ML inference is GPU-bound, business logic is I/O-bound. They scale differently and should deploy independently.
2. **Model swappability** — I can upgrade from BGE-M3 to a newer model without redeploying the Java application.
3. **GPU acceleration** — Python's GPU ecosystem (PyTorch, CUDA) is far more mature than Java's ONNX Runtime GPU support.
4. **Failure isolation** — If the embedding service crashes or OOMs, the core API continues serving structured queries.

The trade-off is an HTTP hop (~5-10ms overhead), which is negligible compared to the embedding computation itself (~50-200ms).

---

### Q6: Explain your draft/published/snapshot three-layer data model.

**Answer:**
This solves a real production problem: you need working copies, official versions, and immutable history simultaneously.

- **Draft** — mutable working copy. Only one draft per report at a time. Editable, validatable, deletable.
- **Published** — the current official version. Visible to queries, exports, and RAG. Protected by optimistic locking (ETag/If-Match).
- **Snapshot** — immutable history. Created on every publish. Never modified, never deleted (even soft-delete preserves snapshots). Enables version comparison and audit trail.

The key insight: `PUT /api/reports/{reportId}` from the old frontend creates a temporary draft → validates → auto-publishes in one request. The frontend doesn't know drafts exist. This is a "fast-path publish" pattern.

---

### Q7: How do you handle concurrent editing conflicts?

**Answer:**
Optimistic Concurrency Control (OCC) at two levels:

1. **Draft edits** — Each draft has a `version` field. Every update uses MongoDB's `findOneAndUpdate` with a version match. If the version doesn't match, it means someone else modified it → return 409.

2. **Published writes** — `publishedVersion` serves as ETag. `If-Match` header is mandatory on all PUT requests to published data. Missing header → 428 Precondition Required. Version mismatch → 409 Conflict.

3. **Draft mutual exclusion** — Only one draft per reportId. If another user has an active draft, return 409 DRAFT_EXISTS. Drafts auto-expire after 24 hours (editLeaseExpiresAt).

Why not pessimistic locking: Report editing is low-contention (few users, infrequent edits). Pessimistic locks add complexity (lock timeouts, deadlocks, cleanup) without proportional benefit.

---

### Q8: Why soft-delete as default instead of physical delete?

**Answer:**
The system claims "auditable, replayable, accountable." Physical delete directly breaks that promise.

- Default `DELETE` → archive. Sets `lifecycleStatus = archived`. Removes from search and queries. Preserves snapshots, audit logs, change logs.
- Physical `purge` → admin-only, requires ADMIN role. Even purge preserves audit_logs (the purge itself is audited).

The audit chain never breaks. If someone asks "what happened to report 200012?", the answer is always traceable.

---

## RAG & AI Design

### Q9: Explain your RAG pipeline and why each step matters.

**Answer:**

```
Query → Intent Classification → Structured Query (if possible)
                              → Embedding → Milvus Search → Rerank → Citation Gate → Generate
```

Each step has a specific purpose:

1. **Intent classification** — Determines if the query can be answered by direct MongoDB query (faster, more accurate) or needs vector search. "Show me report 200012" is a structured query. "Which reports handle currency?" is a semantic search.

2. **Embedding** (BGE-M3) — Converts query to dense vector. Runs in sidecar service, not in-process.

3. **Milvus search** — Top-K retrieval with metadata filtering (reportType, access_tags). Over-retrieves (top-20) for recall.

4. **Reranking** (BGE-reranker-v2-m3) — Cross-encoder that re-scores retrieved documents against the query. Retrieval is recall-optimized, reranking is precision-optimized. This two-stage approach is standard in production RAG.

5. **Citation gate** — Before generating an answer, verify: at least 1 relevant evidence, reranker score above threshold, user has access permission, evidence from published version. If any check fails → refuse to answer. This prevents hallucination.

6. **Generation** — Claude with retrieved context. Every claim must link back to a source document.

---

### Q10: How do you prevent hallucination in your RAG system?

**Answer:**
Four layers of defense:

1. **Citation gate** — No evidence, no answer. The system explicitly refuses when retrieval quality is insufficient.
2. **Grounded generation** — The prompt instructs Claude to only state facts supported by retrieved context, and to cite sources.
3. **Tool-routed assistant** — The LLM can only call whitelisted read-only tools. It cannot invent actions or fabricate data.
4. **Evaluation** — Golden dataset with 50+ annotated Q&A pairs. Groundedness metric must be >= 90%. Hallucination rate must be <= 5%. Tested on every RAG code change.

Key interview phrase: "I don't trust the model by default. Every answer path has a verification step."

---

### Q11: Explain your conversation memory design.

**Answer:**
Three tiers:

1. **History** (MongoDB) — Complete message log. For audit and replay. Never truncated.
2. **Short-term memory** (Redis, TTL 30min) — Last 10 turns (20 messages). This is what the LLM sees as conversation context.
3. **Summary memory** (MongoDB) — When the short-term window overflows, older messages are LLM-summarized. The summary is prepended to context.

Why three tiers:
- You can't send full history to the LLM — token cost explodes.
- Fixed window loses context from earlier turns.
- Summarization preserves meaning while reducing tokens.

Token budget: [system prompt ~500] + [summary ~200] + [recent 10 turns ~2000] + [retrieved context ~1500] + [new message ~100] ≈ 4300 tokens input. Well within Claude's context window while staying cost-effective.

---

### Q12: What's your retrieval quality evaluation strategy?

**Answer:**
I built a custom evaluation framework with a golden dataset of 50+ annotated Q&A pairs. Each case specifies expected intent, expected tools, expected report IDs, and whether refusal is acceptable.

Metrics with V1 gate thresholds:
- Intent Accuracy >= 85%
- Retrieval Hit@5 >= 75%
- Citation Precision >= 80%
- Groundedness >= 90%
- No-Answer Accuracy >= 90%
- Hallucination Rate <= 5%

Evaluation runs on every RAG/assistant code change and every prompt template change. Results are stored in MongoDB for trend analysis.

This is what separates a production RAG system from a demo. A demo hopes the model gets it right. A production system measures and gates on quality.

---

## Production & Operations

### Q13: How do you handle the embedding service being unavailable?

**Answer:**
Graceful degradation. The embedding service health is cached in Redis (30s TTL). When it's down:

- RAG queries fall back to pure structured MongoDB queries
- Chat still works, but only for queries that can be answered by direct database lookup
- Feature flag `embedding.enabled` can manually disable embedding/rerank
- The system returns answers with a note: "Semantic search is currently unavailable. Results are from structured queries only."

The core business functionality (upload, validate, CRUD, export) is completely independent of the embedding service.

---

### Q14: What's your testing strategy?

**Answer:**
Five-layer pyramid:

1. **Unit tests** — Every rule, every tool, every chunker. Lifecycle state machine transitions. Coverage > 80%.
2. **Integration tests** — Testcontainers with real MongoDB, Redis, Milvus. Repository queries, TTL behavior, index verification.
3. **API contract tests** — MockMvc verifying every endpoint matches the exact response shape the frontend expects. This is how we guarantee frontend compatibility.
4. **Performance tests** — Response time baselines. Structured query < 300ms. RAG < 5s. Excel parsing < 3s.
5. **RAG quality evaluation** — Golden dataset, automated metrics, quality gates.

Key principle: Testcontainers for integration tests, not mocks. Mocking MongoDB in tests hides real issues — query behavior, index performance, TTL expiration — that only show up in production.

---

### Q15: How do you handle LLM provider dependency?

**Answer:**
The system is model-agnostic. All AI interactions go through LangChain4j's `ChatLanguageModel` interface. The concrete provider (DeepSeek, Claude, OpenAI) is selected by Spring configuration with `@ConditionalOnProperty`, not hard-coded.

This means:
- Switch providers by changing one config line — zero code changes
- Use DeepSeek in production (cheaper, lower latency from China) and Claude for evaluation
- If a provider has an outage, switch to fallback provider via feature flag
- DeepSeek's API is OpenAI-compatible, so it works through LangChain4j's OpenAI module with just a base URL change

Why this matters: vendor lock-in is a real production risk. Building against an interface instead of a concrete provider is the same principle as coding against `List` instead of `ArrayList`.

---

### Q16: Why did you choose a stable GA release instead of beta/snapshot for LangChain4j?

**Answer:**
Production projects must use GA (Generally Available) releases only. Beta/snapshot versions have three critical risks:

1. **API instability** — Method signatures can change between beta releases, breaking your code on upgrade.
2. **Security gaps** — Vulnerability scanners (Snyk, Dependabot, OWASP) may not track beta artifacts, leaving blind spots.
3. **Enterprise governance** — Real companies have dependency governance policies that reject non-GA artifacts in production builds.

The only exception: if a GA release has a blocking bug that's fixed in the next beta, you document the justification and pin to a specific beta version with an upgrade ticket.

---

### Q17: Why did you choose Claude (Anthropic) as the primary LLM?

**Answer:**
Three factors specific to this project's requirements:

1. **Superior structured output** — Claude excels at following complex output schemas, which is critical for validation findings, intent classification, and tool calling in the RAG pipeline.
2. **Long context window** — Handles large report metadata chunks without truncation.
3. **Tool use maturity** — Claude's native tool calling aligns well with LangChain4j's `@Tool` annotation pattern for the assistant's whitelisted tools.

The system remains model-agnostic. All LLM interaction goes through LangChain4j's `ChatLanguageModel` interface. Adding DeepSeek or GPT as a fallback is one config change — no business code modification.

---

### Q18: Explain your Spring configuration strategy — why multiple YAML files and profiles?

**Answer:**
Three-file separation:

- `application.yml` — Shared defaults. Structure, property names, safe default values. No secrets.
- `application-local.yml` — Local dev overrides. Docker Compose ports, debug-level logging, dev credentials.
- `application-prod.yml` — Production overrides. All secrets via environment variables (`${ENV_VAR}`), info-level logging, stricter timeouts.

Key principles:
- **Secrets never in default config** — API keys always use `${ENV_VAR:}` with empty default.
- **12-Factor App** — Config varies between deploys, code doesn't. Same JAR runs everywhere, only config changes.
- **Virtual threads enabled globally** — Every request handler runs on a virtual thread (Java 21). No thread pool tuning needed for I/O-bound workloads like database queries, Redis calls, and LLM API calls.
- **Externalized timeouts** — LLM (30s), embedding (10s), database (5s) are configurable, not hardcoded. Different environments have different network characteristics.

---

### Q19: 为什么虚拟线程对这个项目很重要？

**Answer:**
虚拟线程是 Java 21 最重要的特性之一，原因是这个项目的负载形态几乎完全是 I/O 密集型，而不是 CPU 密集型。

在传统的平台线程模型下，请求线程在等待外部系统返回时会一直阻塞，例如：
- MongoDB 查询
- Redis 调用
- Embedding sidecar 的 HTTP 调用
- Claude API 调用
- Milvus 查询

这些等待期间，线程基本不做任何有效计算，但依然占着内存和线程资源。在传统 Servlet 模型里，如果很多请求同时卡在慢 I/O 上，真正先耗尽的往往不是 CPU，而是请求线程池。比如很多用户同时触发 Claude API 调用，后面的请求就会开始排队，系统响应能力会明显下降。

虚拟线程改变了这个模型。它的创建和调度成本远低于平台线程。当虚拟线程遇到 I/O 等待时，JVM 会把它挂起，然后把底层载体线程释放出来去处理别的请求。这样应用就能以更低的资源成本支撑更高并发，而不需要维护很大的平台线程池。

这对当前项目尤其重要，因为这里的大部分关键链路都是 I/O 等待：
- **MongoDB** 查询是 I/O 等待
- **Redis** 调用是 I/O 等待
- **Embedding service** 调用是 I/O 等待
- **Claude API** 调用通常会等待几秒
- **Milvus** 检索也是 I/O 等待

所以虚拟线程和这个项目的负载特征是高度匹配的。只需要一行 Spring Boot 配置，就可以让所有请求处理默认运行在虚拟线程上，不再需要针对线程池做复杂调优。

面试时可以直接总结一句：
"这个系统的瓶颈主要不是 CPU，而是等待外部系统返回。虚拟线程把这种等待的并发成本大幅降下来了。"

如果面试官继续追问，可以补一句：
"可以把它理解成几乎用极低内存成本拿到了一个非常大的请求线程池，这在 Java 21 之前很难用传统线程模型优雅做到。"

---

### Q20: Log4j 里的 TRACE、DEBUG、INFO、WARN、ERROR 有什么区别？

**Answer:**
这些日志级别的核心区别是“信息的重要性”和“输出的详细程度”不同。通常从低到高可以理解为：

- `TRACE`：最细粒度的跟踪日志。用于记录非常底层、非常详细的执行过程，比如方法每一步调用、循环内部状态、完整参数流转。平时一般不开，只在深度排障时使用。
- `DEBUG`：调试日志。主要给开发人员排查问题用，用来观察程序内部状态，比如查询条件、命中的记录数、接口入参与返回结果摘要。
- `INFO`：正常运行时的重要信息。表示系统在按预期工作，但这些事件值得记录，比如应用启动完成、任务开始执行、报表上传成功、索引构建完成。
- `WARN`：警告日志。说明系统出现了异常情况或潜在风险，但当前流程还没有完全失败，比如配置缺失后使用默认值、某个下游服务超时后触发降级。
- `ERROR`：错误日志。说明当前操作已经失败，通常需要人工关注或告警介入，比如数据库连接失败、接口处理异常、发布流程执行失败。

如果配置是 `root: INFO`，它的含义是：
- 输出 `INFO`、`WARN`、`ERROR`
- 不输出 `DEBUG`、`TRACE`

也就是说，系统默认保留关键业务日志和错误日志，避免日志过多影响可读性和性能。

结合这个项目，可以这样理解：
- `INFO`：应用启动、上传完成、发布成功、重建索引开始/结束
- `WARN`：Embedding 服务不可用，系统降级为结构化查询；某些配置缺失，使用默认值
- `ERROR`：MongoDB 连接失败、Milvus 查询异常、发布流程报错
- `DEBUG`：查询条件、命中的文档数量、外部接口调用耗时
- `TRACE`：规则引擎逐条校验的细节过程

面试时可以直接总结一句：
"日志级别本质上是在平衡可观测性和噪音。INFO 看业务主流程，WARN 看风险，ERROR 看失败，DEBUG 和 TRACE 主要用于排障。"

如果面试官继续追问为什么线上通常不用 DEBUG，可以补一句：
"因为 DEBUG 和 TRACE 日志量太大，线上长期打开会增加 I/O 开销，也会淹没有价值的信息，所以生产环境通常默认 INFO。"

---

### Q21: 什么是 kebab-case？它和 Spring Boot 配置绑定有什么关系？

**Answer:**
`kebab-case` 是一种命名方式，特点是全部小写，单词之间用短横线 `-` 连接。

例如：
- `collection-name`
- `search-top-k`
- `rerank-top-k`

Java 里通常用的是 `camelCase`，例如：
- `collectionName`
- `searchTopK`
- `rerankTopK`

Spring Boot 会自动把配置文件里的 `kebab-case` 映射到 Java 字段里的 `camelCase`。

例如：
- YAML: `collection-name`
- Java: `collectionName`

面试时可以直接总结一句：
"YAML 里一般用 kebab-case，Java 里一般用 camelCase，Spring Boot 会自动帮我们做绑定转换。"

---

### Q22: Spring 里对象注入有哪三种方式？为什么构造器注入最好？

**Answer:**
Spring 常见的依赖注入有三种：

- **字段注入**：直接在字段上加 `@Autowired`
- **Setter 注入**：通过 `setXxx()` 方法注入
- **构造器注入**：通过构造器传入依赖

其中最推荐的是**构造器注入**。

原因很简单：
- 依赖最清晰，看构造器就知道这个类需要什么
- 可以配合 `final` 使用，依赖创建后不能被改
- 对象一创建就是完整的，不会先创建空对象再补依赖
- 最容易做单元测试，不依赖 Spring 容器也能直接 new

字段注入和 Setter 注入也能用，但问题是依赖不够显式，而且不适合配合 `final`，测试也相对更麻烦。

通常怎么用：
- `Spring Bean` 默认用**构造器注入**
- 如果类只有一个构造器，Spring 会自动注入，通常**不需要写 `@Autowired`**
- 只有在一个类有多个构造器时，才需要用 `@Autowired` 指定 Spring 该选哪一个

项目里建议统一这样写：

```java
@Service
public class SomeService {

    private final DependencyA a;
    private final DependencyB b;

    public SomeService(DependencyA a, DependencyB b) {
        this.a = a;
        this.b = b;
    }
}
```

面试时可以直接总结一句：
"我在 Spring 项目里默认使用构造器注入，因为它最清晰、最安全、最好测试；单构造器场景下通常连 `@Autowired` 都不用写。"

---

### Q23: 普通内部类和静态内部类有什么区别？为什么配置子类常写成 static？

**Answer:**
核心区别只有一条：

- **普通内部类**依赖外部类实例
- **静态内部类**不依赖外部类实例，只是逻辑上归属于外部类

所以：
- 普通内部类创建时需要先有外部对象
- 静态内部类可以直接创建，不需要外部对象

为什么配置子类常写成 `static`：
- 它通常只是某个配置类下面的一个子结构
- 只是表达“归属关系”，不是表达“依赖某个外部对象实例”
- 用 `static` 可以避免内部类默认持有外部类实例引用，结构更干净

例如 `LlmProperties.Anthropic` 的意思是：
- `Anthropic` 这组配置属于 `LlmProperties`
- 但它不需要绑定某一个 `LlmProperties` 对象

面试时可以直接总结一句：
"普通内部类和外部对象绑定，静态内部类只和外部类的定义绑定。配置子类一般只是表达结构归属，所以更适合写成 static。"

---

### Q24: Spring Boot 的 `application.yml` 和 `application-{profile}.yml` 是怎么生效的？

**Answer:**
Spring Boot 加载配置时，基本顺序是：

1. `application.yml`
2. `application-{profile}.yml`

其中：
- `application.yml` 提供共享默认值
- `application-{profile}.yml` 会在它上面继续加载，并覆盖同名配置

“覆盖”的意思是：
- 如果默认配置里是 `INFO`
- `application-local.yml` 里把同一个键改成了 `DEBUG`
- 那最终生效的是 `DEBUG`

如果某个配置项只在 `application.yml` 里有，而 `application-local.yml` 没写，那么最终仍然使用默认配置里的值。

面试时可以直接总结一句：
"`application.yml` 负责放共享默认值，profile 配置文件只覆盖自己关心的那部分，没有重写的配置继续沿用默认值。"

---

## Records

_New entries will be added as we build each module._
