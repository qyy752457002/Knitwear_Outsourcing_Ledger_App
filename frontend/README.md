# 外协收发记账 — React Native 前端

基于 Expo 的 React Native 应用，通过 REST API 与 FastAPI 后端通信。

## 目录结构

```
frontend/
├── App.tsx                 # 应用入口
├── app.json                # Expo 配置（含 apiBaseUrl）
├── src/
│   ├── api/                # API 客户端与接口封装
│   ├── components/         # 通用组件
│   ├── constants/          # 颜色等常量
│   ├── navigation/         # 导航（Tab + Stack）
│   ├── screens/            # 页面
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数
└── package.json
```

## 启动

```bash
npm install
npm start
```

按 `a` 打开 Android 模拟器，或扫码用 Expo Go 真机调试。

## API 地址配置

编辑 `app.json`：

```json
"extra": {
  "apiBaseUrl": "http://localhost:8000/api/v1"
}
```

- iOS 模拟器：`localhost` 可用
- Android 模拟器：使用 `10.0.2.2`
- 真机：使用电脑局域网 IP

## 页面清单

| Tab/页面 | 对应产品文档 |
|----------|-------------|
| 首页（工厂列表） | 页面 1 |
| 工厂编辑 | 页面 2 |
| 款式列表 / 编辑 | 页面 3-4 |
| 收发记账 | 页面 5 |
| 统计对账 | 页面 6 |
| 月度汇总 / 对账卡片 | 页面 7-8 |
| 我的 | 页面 9 |
| 回收站 | 页面 10 |
