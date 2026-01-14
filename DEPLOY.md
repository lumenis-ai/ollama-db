# Cloudflare Workers 部署指南

## 项目适配说明

这个项目已经适配到 Cloudflare Workers 环境。主要改动：

### 文件结构

- `src/worker.ts` - Cloudflare Workers 入口文件
- `src/data-loader.worker.ts` - Workers 版本的数据加载器（不使用 Node.js fs 模块）
- `src/resolvers.worker.ts` - Workers 版本的 GraphQL resolvers
- `src/index.ts` - 保留的本地开发服务器（可选）

### 配置文件

- `wrangler.jsonc` - Cloudflare Workers 配置
- `tsconfig.json` - 更新为支持 ES2020 模块和 Workers 类型
- `package.json` - 添加了 wrangler 和 @cloudflare/workers-types 依赖

## 部署步骤

### 1. 安装依赖

```bash
pnpm install
```

或使用 npm/yarn：

```bash
npm install
# 或
yarn install
```

### 2. 构建项目

```bash
pnpm build
```

这将编译 TypeScript 代码到 `dist/` 目录。

### 3. 本地测试（可选）

在部署前，你可以在本地测试：

```bash
pnpm dev
```

这将启动 Cloudflare Workers 的本地开发服务器。

### 4. 部署到 Cloudflare Workers

```bash
pnpm deploy
```

或使用完整命令：

```bash
npx wrangler deploy
```

## 访问你的 API

部署成功后，你的 API 将可以通过以下 URL 访问：

- **GraphiQL 界面**: `https://ollama-db.litingyes.workers.dev/`
- **GraphQL Endpoint**: `https://ollama-db.litingyes.workers.dev/graphql`

### 示例查询

#### 1. 列出所有模型（前 10 个）

```graphql
query ListModels {
  models(limit: 10) {
    lastUpdated
    totalModels
    models {
      name
      description
      capabilities
      sizes
      url
    }
  }
}
```

#### 2. 按名称搜索模型

```graphql
query SearchByName {
  models(filter: { nameContains: "qwen" }) {
    totalModels
    models {
      name
      description
    }
  }
}
```

#### 3. 获取特定模型

```graphql
query GetModel {
  model(name: "qwen2.5-coder:32b") {
    name
    description
    capabilities
    sizes
    url
  }
}
```

#### 4. 获取所有可用功能

```graphql
query GetCapabilities {
  capabilities
}
```

#### 5. 使用 curl 测试

```bash
curl -X POST https://ollama-db.litingyes.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ models(limit: 5) { totalModels models { name description } } }"}'
```

## 注意事项

### Cloudflare Workers 限制

- **脚本大小限制**: 
  - 免费版: 1MB（压缩后）
  - 付费版: 10MB（压缩后）
  
- **CPU 时间限制**:
  - 免费版: 10ms
  - 付费版: 50ms（可请求增加到 30s）

- **请求数限制**:
  - 免费版: 100,000 请求/天
  - 付费版: 10,000,000+ 请求/月

### 数据更新

`models.json` 文件会被打包到 Worker 中。如果需要更新数据：

1. 运行爬虫更新数据：
   ```bash
   pnpm scrape
   ```

2. 重新构建和部署：
   ```bash
   pnpm build && pnpm deploy
   ```

### 本地开发

如果你想在本地使用 Node.js 环境开发（不使用 Workers）：

```bash
pnpm dev:local
```

这将启动原始的 Apollo Server standalone 服务器在端口 4000。

## 故障排除

### 部署失败

如果部署失败，检查：

1. 是否已登录 Cloudflare：
   ```bash
   npx wrangler login
   ```

2. 检查 wrangler.jsonc 配置是否正确

3. 确保已运行 `pnpm build`

### 访问返回错误

如果访问返回错误，检查：

1. 浏览器开发者工具的网络标签
2. Cloudflare Dashboard 的 Workers 日志
3. 确保 GraphQL 查询语法正确

### 性能问题

如果遇到性能问题：

1. 使用 `limit` 参数限制返回的模型数量
2. 考虑添加缓存（可以使用 Cloudflare KV）
3. 检查是否超过了 CPU 时间限制

## 监控和日志

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择 `ollama-db` Worker
3. 查看 Metrics 和 Logs 标签

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Apollo Server 文档](https://www.apollographql.com/docs/apollo-server/)
