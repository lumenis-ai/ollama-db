# GraphQL API 使用示例

GraphQL API 服务器提供了对 Ollama 模型数据库的查询接口。

## 服务器地址

- 开发环境: `http://localhost:4000/`
- GraphQL Playground: `http://localhost:4000/graphql`

## 启动服务器

```bash
# 开发模式（带热重载）
pnpm dev

# 生产模式
pnpm build
pnpm start
```

## 查询示例

### 1. 查询所有模型

```graphql
query {
  models {
    lastUpdated
    totalPages
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

### 2. 按名称搜索模型（模糊匹配）

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

### 3. 按描述搜索模型

```graphql
query {
  models(filter: { descriptionContains: "vision" }) {
    totalModels
    models {
      name
      description
      capabilities
    }
  }
}
```

### 4. 按 capabilities 过滤（需要包含所有指定的能力）

```graphql
query {
  models(filter: { capabilities: ["tools", "vision"] }) {
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

### 5. 按 sizes 过滤（包含至少一个指定的大小）

```graphql
query {
  models(filter: { sizes: ["8b"] }) {
    totalModels
    models {
      name
      sizes
    }
  }
}
```

### 6. 组合过滤条件

```graphql
query {
  models(
    filter: {
      nameContains: "qwen"
      capabilities: ["vision"]
      sizes: ["8b", "32b"]
    }
  ) {
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

### 7. 分页查询

```graphql
query {
  models(limit: 10, offset: 0) {
    totalModels
    models {
      name
      description
    }
  }
}
```

### 8. 获取单个模型（精确名称匹配）

```graphql
query {
  model(name: "qwen3-vl") {
    name
    description
    capabilities
    sizes
    url
  }
}
```

### 9. 获取所有可用的 capabilities

```graphql
query {
  capabilities
}
```

### 10. 获取所有可用的 sizes

```graphql
query {
  sizes
}
```

### 11. 复杂组合查询

```graphql
query {
  # 获取所有 capabilities
  capabilities
  
  # 获取所有 sizes
  sizes
  
  # 查询有 vision 和 tools 能力的 8b 模型
  visionModels: models(
    filter: {
      capabilities: ["vision", "tools"]
      sizes: ["8b"]
    }
    limit: 5
  ) {
    totalModels
    models {
      name
      description
      capabilities
      sizes
    }
  }
  
  # 获取特定模型详情
  specificModel: model(name: "qwen3-vl") {
    name
    description
    capabilities
    sizes
    url
  }
}
```

## 使用 curl 测试

### 查询所有模型

```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ models { totalModels models { name description } } }"
  }'
```

### 搜索特定模型

```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query SearchModels($filter: ModelFilter) { models(filter: $filter) { totalModels models { name description } } }",
    "variables": {
      "filter": {
        "nameContains": "qwen"
      }
    }
  }'
```

### 按 capabilities 过滤

```bash
curl -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query FilterByCapabilities($capabilities: [String!]) { models(filter: { capabilities: $capabilities }) { totalModels models { name capabilities } } }",
    "variables": {
      "capabilities": ["tools", "vision"]
    }
  }'
```

## 使用 JavaScript/TypeScript 客户端

### 使用 fetch

```typescript
async function queryModels() {
  const response = await fetch('http://localhost:4000/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
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
      `,
    }),
  });

  const data = await response.json();
  console.log(data);
}
```

### 使用 Apollo Client

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
});

const GET_MODELS = gql`
  query GetModels($filter: ModelFilter, $limit: Int, $offset: Int) {
    models(filter: $filter, limit: $limit, offset: $offset) {
      totalModels
      lastUpdated
      models {
        name
        description
        capabilities
        sizes
        url
      }
    }
  }
`;

async function fetchModels() {
  const { data } = await client.query({
    query: GET_MODELS,
    variables: {
      filter: {
        capabilities: ['vision'],
      },
      limit: 10,
    },
  });

  console.log(data.models);
}
```

## Schema 文档

### 类型定义

- **Model**: 表示一个 Ollama 模型
  - `name`: 模型名称
  - `description`: 模型描述
  - `capabilities`: 模型能力列表
  - `sizes`: 模型大小列表
  - `url`: 模型的 Ollama 库链接

- **ModelsResponse**: 模型查询响应
  - `lastUpdated`: 数据最后更新时间
  - `totalPages`: 总页数
  - `totalModels`: 匹配的模型总数
  - `models`: 模型列表

- **ModelFilter**: 过滤条件
  - `nameContains`: 名称包含的字符串（不区分大小写）
  - `descriptionContains`: 描述包含的字符串（不区分大小写）
  - `capabilities`: 必须包含的所有能力（AND 逻辑）
  - `sizes`: 至少包含一个的大小（OR 逻辑）

### 查询接口

- `models(filter, limit, offset)`: 搜索和过滤模型
- `model(name)`: 根据精确名称获取单个模型
- `capabilities`: 获取所有可用的能力列表
- `sizes`: 获取所有可用的大小列表
