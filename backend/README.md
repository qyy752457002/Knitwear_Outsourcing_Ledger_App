# 毛织厂外协收发记账 — 后端

FastAPI + MongoDB (Beanie ODM) RESTful API。

## 快速开始

### 1. 安装依赖

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
copy .env.example .env
```

确保 MongoDB 已启动（默认 `mongodb://localhost:27017`）。

### 3. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health
- API 前缀：`/api/v1`

### 4. 开发登录

手机号登录使用固定验证码（见 `.env` 中 `DEV_SMS_CODE`，默认 `123456`）：

```bash
POST /api/v1/auth/phone/login
{
  "phone": "13800138000",
  "sms_code": "123456"
}
```

## 目录结构

```
backend/
├── app/
│   ├── main.py           # FastAPI 入口
│   ├── config.py         # 配置
│   ├── database.py       # MongoDB 连接
│   ├── dependencies.py   # 依赖注入
│   ├── core/             # 安全、权限、异常
│   ├── models/           # Beanie Document 模型
│   ├── schemas/          # Pydantic 请求/响应
│   ├── routers/          # REST 路由
│   └── services/         # 业务逻辑
├── requirements.txt
└── .env.example
```

## MongoDB 集合

| 集合 | 说明 |
|------|------|
| `users` | 用户 |
| `factories` | 上游工厂 |
| `factory_members` | 工厂成员关系 |
| `styles` | 款式 |
| `records` | 收发记录 |
| `settlements` | 结算标记 |
| `invitations` | 邀请码 |

详细接口设计见项目根目录 [后端接口与数据库设计.md](../后端接口与数据库设计.md)。
