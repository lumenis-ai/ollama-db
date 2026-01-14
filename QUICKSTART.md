# 快速开始指南

## 5 分钟上手 GraphQL API

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:4000` 启动。

### 3. 打开浏览器测试

访问 `http://localhost:4000/` 将自动打开 Apollo Server 的 GraphQL Playground。

### 4. 尝试第一个查询

在 Playground 中输入：

```graphql
query {
  capabilities
}
```

点击运行按钮，你将看到：

```json
{
  "data": {
    "capabilities": ["embedding", "thinking", "tools", "vision"]
  }
}
```

### 5. 搜索模型

尝试搜索包含 "qwen" 的模型：

```graphql
query {
  models(filter: { nameContains: "qwen" }) {
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

### 6. 过滤特定能力的模型

查找具有视觉能力的 8b 模型：

```graphql
query {
  models(filter: { capabilities: ["vision"], sizes: ["8b"] }) {
    totalModels
    models {
      name
      capabilities
      sizes
    }
  }
}
```

## 常用 npm 脚本

```bash
# 开发模式（带热重载）
pnpm dev

# 编译 TypeScript
pnpm build

# 生产模式运行
pnpm start

# 运行爬虫（更新数据）
pnpm scrape
```

## 项目结构

```
src/
├── index.ts          # 服务器入口
├── schema.ts         # GraphQL Schema 定义
├── resolvers.ts      # 查询逻辑实现
├── types.ts          # TypeScript 类型
└── data-loader.ts    # 数据加载和过滤
```

## 下一步

- 查看 [API_EXAMPLES.md](API_EXAMPLES.md) 了解更多查询示例
- 查看 [TEST_RESULTS.md](TEST_RESULTS.md) 了解测试结果
- 查看 [README.md](README.md) 了解完整文档

## 故障排除

### 端口被占用

如果 4000 端口被占用，设置环境变量：

```bash
PORT=5000 pnpm dev
```

### TypeScript 编译错误

清理并重新构建：

```bash
rm -rf dist
pnpm build
```

### 数据未找到

确保 `data/models.json` 文件存在。如果不存在，运行爬虫：

```bash
cd crawler
python scraper.py
```
