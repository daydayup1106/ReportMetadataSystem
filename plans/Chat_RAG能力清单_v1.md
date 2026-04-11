# Chat / RAG 能力清单 v1

## 1. 能力定位

Chat/RAG 不是通用聊天机器人。

它只服务于：

- 报表元数据查询
- 参数查询
- 配置查询
- 角色查询
- 差异对比
- 治理问题定位
- 解释型问答
- 导出辅助

## 2. 支持的问题类型

### Q1. 报表元数据查询

支持示例：

- 哪些报表包含 `currency` 字段？
- 报表 `200012` 有哪些 columns？
- 哪些报表属于某个 `reportType`？

对应工具：

- `search_reports`
- `get_report_detail`

### Q2. 参数查询

支持示例：

- 哪些报表有 `startDate` 参数？
- `accountId` 参数在哪些报表里出现？
- 某参数对应哪个原始字段？

对应工具：

- `search_parameters`
- `get_report_detail`

### Q3. 配置查询

支持示例：

- 某报表的 config 是什么？
- 哪些报表不可删除？
- 哪些报表 category 属于某分类？

对应工具：

- `search_configs`
- `get_report_config`

### Q4. 角色/权限查询

支持示例：

- 某报表在 `prod` 的 role 配置是什么？
- 哪些报表在 `uat` 对 tester 不可见？
- dev 和 prod 差异有哪些？

对应工具：

- `get_report_roles`
- `compare_roles_by_env`

### Q5. 差异对比

支持示例：

- 比较两个报表的 columns 差异
- 比较同一报表两个版本的参数变化
- 比较不同环境的配置差异

对应工具：

- `compare_reports`
- `compare_report_versions`
- `compare_roles_by_env`

### Q6. 治理问题查询

支持示例：

- 哪些报表 description 缺失？
- 哪些字段命名不规范？
- 哪些报表存在重复 columns？

对应工具：

- `search_findings`
- `get_validation_result`

### Q7. 解释型问答

支持示例：

- 这个字段是什么意思？
- 为什么这个报表被判成 warning？
- 这个配置项的业务作用是什么？

对应工具：

- `explain_field`
- `get_validation_result`
- `get_report_detail`

### Q8. 导出辅助

支持示例：

- 导出某报表的完整元数据包
- 哪个报表适合导出给 UAT review？

对应工具：

- `export_report_package`
- `suggest_export_candidates`

## 3. 数据来源

RAG 只允许从以下知识源取证：

- Report 主数据
- Columns
- Parameters
- Roles
- Config
- UI Settings
- Validation Findings
- Version Snapshots
- Audit Logs

不允许引用：

- 外部互联网开放知识
- 未入库的业务猜测
- 无来源的模型记忆

## 4. 回答要求

每次回答必须尽量包含：

- 直接答案
- 证据引用
- 来源对象
- 置信说明
- 若信息不足则明确说明

禁止：

- 无证据编造
- 把 AI 推测包装成事实
- 自动生成正式配置并假装真实存在

## 5. 回答策略

- 优先走结构化查询
- 查不到再走向量检索
- 检索结果不足时明确返回“未找到足够证据”
- 涉及差异时必须列出对比维度
- 涉及治理问题时优先返回问题项和严重级别

## 6. 会话能力

V1 支持：

- 上下文连续提问
- 记住当前正在讨论的 `reportId`
- 对上一问结果继续追问
- 在当前会话中保留筛选条件

V1 不支持：

- 跨会话长期个性化记忆
- 自主任务规划
- 自动后台执行复杂工作流
- 自动修改数据

## 7. Out of Scope

不支持的问题：

- 请直接帮我修改配置
- 请自动生成 description 并保存
- 请发邮件给用户
- 请执行报表并返回真实业务数据
- 请调用外部业务系统完成审批
- 请回答与报表元数据无关的开放问题

## 8. V1 工具清单

- `search_reports`
- `get_report_detail`
- `search_parameters`
- `get_report_config`
- `get_report_roles`
- `compare_reports`
- `compare_report_versions`
- `compare_roles_by_env`
- `search_findings`
- `get_validation_result`
- `explain_field`
- `export_report_package`

## 9. 一句话边界

Chat/RAG 负责：

**查、看、比、解释、引用、导出建议。**

Chat/RAG 不负责：

**改、批、发、跑、配、编造。**
