# 毛织厂外协收发记账

面向毛织厂外协场景的收发记账工具。支持上游工厂管理、款式维护、每日收发记录、统计对账、成员协作与回收站。

采用前后端分离架构：**React Native (Expo)** 移动端 + **FastAPI** 后端 + **本地 MongoDB**。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React Native 0.76、Expo 52、TypeScript、React Navigation |
| 后端 | Python 3.11+、FastAPI、Beanie (MongoDB ODM) |
| 数据库 | MongoDB 7（本地 Docker 或本机安装） |
| 认证 | JWT Bearer Token |

## 项目结构

```
Tq Project/
├── frontend/                 # React Native 移动端
├── backend/                  # FastAPI REST API
│   ├── app/                  # 应用代码
│   ├── docker-compose.yml    # 本地 MongoDB（Docker）
│   ├── requirements.txt
│   └── .env.example
├── 产品交互说明文档.md        # 产品交互与页面说明
└── 后端接口与数据库设计.md    # API 与数据模型设计
```

## 环境要求

- **Node.js** 18+（前端）
- **Python** 3.11+（后端）
- **Docker Desktop**（推荐，用于运行 MongoDB）
- **Android Studio / 模拟器** 或 Expo Go（移动端调试）

## 快速开始

需要同时运行三个部分：**MongoDB → 后端 → 前端**。

### 1. 启动 MongoDB

```powershell
cd backend
docker compose up -d
```

确认容器运行中：

```powershell
docker ps
```

应看到 `tq-mongodb`，端口 `27017`。

> 若拉取镜像失败（无法连接 Docker Hub），`docker-compose.yml` 已配置国内镜像源 `docker.1ms.run/library/mongo:7`。请确保 Docker Desktop 已启动后再执行上述命令。

**备选方案：** 从 [MongoDB Community Server](https://www.mongodb.com/try/download/community) 本地安装，确保服务监听 `27017` 端口。

### 2. 启动后端

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

macOS / Linux 将 `.venv\Scripts\activate` 换为 `source .venv/bin/activate`，`copy` 换为 `cp`。

验证：

- 健康检查：http://localhost:8000/health → `{"status":"ok"}`
- API 文档：http://localhost:8000/docs
- 接口前缀：`/api/v1`

首次启动时，Beanie 会自动创建 MongoDB 集合与索引。

### 3. 启动前端

```powershell
cd frontend
npm install
npm start
```

在终端选择 **Android** 打开模拟器，或用 Expo Go 扫码真机调试。

### 4. 开发登录

开发环境使用固定验证码，无需真实短信：

| 字段 | 值 |
|------|-----|
| 手机号 | 任意 11 位（如 `13800138000`） |
| 验证码 | `123456`（见 `backend/.env` 中 `DEV_SMS_CODE`） |

## API 地址配置

前端通过 `frontend/app.json` 中的 `extra.apiBaseUrl` 连接后端，代码中已对 Android 模拟器做了 `10.0.2.2` 回退。

| 运行环境 | API 地址 |
|----------|----------|
| Android 模拟器 | `http://10.0.2.2:8000/api/v1`（已默认配置） |
| iOS 模拟器 | `http://localhost:8000/api/v1` |
| 真机调试 | `http://<电脑局域网IP>:8000/api/v1` |

修改 `app.json` 后需重启 Expo（`npm start`）并在模拟器中重新加载（按 **R** 两次）。

## 环境变量

复制 `backend/.env.example` 为 `backend/.env`：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MONGODB_URL` | MongoDB 连接字符串 | `mongodb://localhost:27017` |
| `MONGODB_DB` | 数据库名 | `tq_accounting` |
| `JWT_SECRET` | JWT 签名密钥 | 请改为随机字符串 |
| `JWT_ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access Token 有效期（分钟） | `120` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh Token 有效期（天） | `30` |
| `CORS_ORIGINS` | 允许的跨域来源 | `["*"]` |
| `DEV_SMS_CODE` | 开发环境固定验证码 | `123456` |

## 功能模块

- **首页** — 上游工厂列表、今日收发概览、搜索
- **工厂 / 款式** — CRUD、回收站、软删除
- **收发记账** — 发出 / 收回记录，支持数量格式解析
- **统计对账** — 工厂维度统计、月度汇总、对账卡片
- **我的** — 编辑昵称、退出登录、成员管理、回收站入口
- **权限** — Owner / Member 角色，邀请码加入工厂

## 常见问题

### pip 安装依赖失败

使用清华镜像：

```powershell
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 前端报 `Network request failed`

1. 确认后端已启动且 `/health` 可访问
2. Android 模拟器应使用 `10.0.2.2`，不要用 `localhost`
3. 在模拟器浏览器访问 `http://10.0.2.2:8000/health` 测试网络
4. 修改配置后重启 Expo 并重新加载 App

### Docker 拉取镜像超时

确保 Docker Desktop 已运行。若仍失败，可在 Docker Desktop → Settings → Docker Engine 中添加镜像加速器：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

### 添加工厂后首页不显示

下拉刷新首页。若仍为空，检查后端日志；常见原因是 MongoDB 未启动或后端未连上数据库。

## 相关文档

- [产品交互说明文档](./产品交互说明文档.md)
- [后端接口与数据库设计](./后端接口与数据库设计.md)
- [后端 README](./backend/README.md)
- [前端 README](./frontend/README.md)

## 开发命令速查

```powershell
# 终端 1 — MongoDB
cd backend && docker compose up -d

# 终端 2 — 后端
cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 终端 3 — 前端
cd frontend && npm start
```
