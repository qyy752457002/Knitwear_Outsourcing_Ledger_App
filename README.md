# 毛织厂外协收发记账

前后端分离架构：React Native (Expo) + Python FastAPI + MongoDB Atlas

## 项目结构

```
Tq Project/
├── frontend/          # React Native 移动端
├── backend/           # FastAPI REST API
├── 产品交互说明文档.md
└── 后端接口与数据库设计.md
```

## 快速开始

### 1. 配置 MongoDB Atlas

后端使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 托管数据库，无需本地安装 MongoDB。

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)，创建免费 **M0 集群**（任选云厂商与区域）。
2. **Database Access**：创建数据库用户，记下用户名与密码。
3. **Network Access**：添加当前开发机器的 IP（开发阶段可临时使用 `0.0.0.0/0`，生产环境请收紧）。
4. 进入集群 **Connect → Drivers**，复制连接字符串，格式类似：

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   将 `<username>`、`<password>` 替换为实际凭据；密码含特殊字符时需 URL 编码。

### 2. 启动后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
```

编辑 `backend/.env`，填入 Atlas 连接信息：

```env
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=tq_accounting
JWT_SECRET=change-me-to-a-random-secret-key
DEV_SMS_CODE=123456
```

启动 API 服务：

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

首次启动时，Beanie 会在 Atlas 中自动创建集合并建立索引。

### 3. 启动前端

```bash
cd frontend
npm install

# 复制 assets（首次需要 icon/splash，见 frontend/assets/.gitkeep）
npm start
```

**Android 模拟器访问本机 API**：在 `frontend/app.json` 的 `extra.apiBaseUrl` 改为：

```
http://10.0.2.2:8000/api/v1
```

**真机调试**：改为电脑局域网 IP，如 `http://192.168.1.100:8000/api/v1`

### 4. 开发登录

- 手机号：`13800138000`
- 验证码：`123456`（见 `backend/.env` 中 `DEV_SMS_CODE`）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React Native (Expo 52) + TypeScript + React Navigation |
| 后端 | Python 3.11+ + FastAPI + Beanie (MongoDB ODM) |
| 数据库 | MongoDB Atlas（云端托管） |
| 认证 | JWT Bearer Token |

## 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `MONGODB_URL` | Atlas 连接字符串 | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/...` |
| `MONGODB_DB` | 数据库名称 | `tq_accounting` |
| `JWT_SECRET` | JWT 签名密钥 | 随机长字符串 |
| `DEV_SMS_CODE` | 开发环境固定验证码 | `123456` |

完整变量列表见 [backend/.env.example](./backend/.env.example)。

## 主要功能模块

- 工厂 / 款式 CRUD 与回收站
- 收发记账（发出/收回、数量格式解析）
- 统计对账与对账卡片
- 成员邀请（Owner/Member 权限）
- 结算状态标记

详细 API 见 [后端接口与数据库设计.md](./后端接口与数据库设计.md)。
