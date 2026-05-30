# FoodMind AI

AI 智能食物決策助手，可部署到 Vercel / GitHub Pages。

## 本機測試

```bash
npm install
npm run dev
```

## Vercel 部署

Build Command:

```bash
npm run build
```

Output Directory:

```bash
dist
```

## 注意

預設啟用 Demo 模式，不需要 API Key 也可測試。
如要使用 OpenAI API，請到網站「設定」頁輸入 API Key 並取消 Demo 模式。

公開網站不建議把 API Key 放前端，正式版本應改用後端 API / serverless function。
