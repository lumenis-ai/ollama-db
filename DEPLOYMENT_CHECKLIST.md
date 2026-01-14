# ✅ 部署检查清单

## 准备工作

- [x] 创建 Cloudflare Workers 适配的代码
- [x] 更新配置文件
- [x] 构建成功（`pnpm build`）
- [ ] 登录 Cloudflare（`npx wrangler login`）
- [ ] 部署到 Workers（`pnpm deploy`）
- [ ] 验证部署成功

## 快速部署命令

```bash
# 1. 确保依赖已安装
pnpm install

# 2. 登录 Cloudflare（如果还没登录）
npx wrangler login

# 3. 构建项目
pnpm build

# 4. 部署
pnpm deploy

# 5. 查看实时日志（可选）
npx wrangler tail
```

## 部署后验证

### ✅ 检查 1: 访问主页

打开浏览器访问: `https://ollama-db.litingyes.workers.dev/`

**预期结果**: 
- 看到 GraphiQL 交互式界面
- 界面左侧有示例查询
- 可以点击运行按钮执行查询

### ✅ 检查 2: 测试 API 端点

```bash
curl https://ollama-db.litingyes.workers.dev/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ capabilities }"}'
```

**预期结果**:
```json
{
  "data": {
    "capabilities": [
      "embedding",
      "tools",
      "vision"
    ]
  }
}
```

### ✅ 检查 3: 测试模型查询

```bash
curl https://ollama-db.litingyes.workers.dev/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ models(limit: 3) { totalModels models { name } } }"}'
```

**预期结果**:
```json
{
  "data": {
    "models": {
      "totalModels": 3,
      "models": [
        { "name": "nemotron-3-nano" },
        { "name": "llama3.3" },
        { "name": "qwen2.5-coder:32b" }
      ]
    }
  }
}
```

### ✅ 检查 4: 测试过滤功能

在 GraphiQL 界面执行:

```graphql
query SearchQwen {
  models(filter: { nameContains: "qwen" }, limit: 5) {
    totalModels
    models {
      name
      description
      capabilities
      sizes
    }
  }
}
```

**预期结果**: 返回包含 "qwen" 的模型列表

## 常见问题排查

### ❌ 问题 1: 部署时提示 "Not logged in"

**解决方案**:
```bash
npx wrangler login
```

### ❌ 问题 2: 访问返回 404

**可能原因**: 
- Worker 名称配置错误
- 部署未成功

**解决方案**:
1. 检查 `wrangler.jsonc` 中的 `name` 字段
2. 重新部署: `pnpm deploy`
3. 检查部署输出中的 URL

### ❌ 问题 3: 访问返回 500 错误

**可能原因**:
- 代码有 bug
- models.json 加载失败

**解决方案**:
1. 查看实时日志: `npx wrangler tail`
2. 在本地测试: `pnpm dev`
3. 检查构建输出

### ❌ 问题 4: GraphiQL 界面显示但无法查询

**可能原因**:
- CORS 配置问题
- GraphQL endpoint 路径错误

**解决方案**:
1. 检查浏览器开发者工具的网络标签
2. 确认 `/graphql` 端点可访问
3. 查看 Worker 日志

## 性能验证

### 🚀 响应时间测试

```bash
# 测试响应时间（多次执行取平均值）
for i in {1..5}; do
  time curl -s https://ollama-db.litingyes.workers.dev/graphql \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ capabilities }"}' > /dev/null
done
```

**预期**: 每次请求 < 500ms

### 📊 监控指标

在 Cloudflare Dashboard 查看:
1. 访问 https://dash.cloudflare.com/
2. 选择 "Workers & Pages"
3. 点击 "ollama-db"
4. 查看 "Metrics" 标签

**关注指标**:
- Requests: 请求数量
- Errors: 错误率（应该 < 1%）
- Duration: 平均响应时间
- CPU Time: CPU 使用时间

## 🎉 部署成功！

如果所有检查都通过，恭喜你！你的 Ollama Models API 已成功部署到 Cloudflare Workers！

### 接下来可以做什么？

1. **分享 API**: 将 API URL 分享给需要的人
2. **监控使用**: 定期查看 Cloudflare Dashboard
3. **更新数据**: 运行爬虫更新模型数据后重新部署
4. **添加功能**: 根据需要扩展 GraphQL schema

### 📚 相关文档

- [API_EXAMPLES.md](API_EXAMPLES.md) - 详细的 API 使用示例
- [DEPLOY.md](DEPLOY.md) - 完整的部署指南
- [CLOUDFLARE_WORKERS.md](CLOUDFLARE_WORKERS.md) - Workers 详细文档
- [PROBLEM_SOLUTION.md](PROBLEM_SOLUTION.md) - 技术问题和解决方案

## 需要帮助？

如果遇到其他问题:
1. 查看 Cloudflare Workers 文档: https://developers.cloudflare.com/workers/
2. 查看 Apollo Server 文档: https://www.apollographql.com/docs/apollo-server/
3. 提交 GitHub Issue
