# FoodMind AI v2｜後端 API 安全版

這個版本已經取消前端 API Key 輸入，改為 Vercel Serverless API。

## 專案結構

```text
api/
  food.js
  image.js
  vision.js
src/
  App.jsx
  main.jsx
  index.css
package.json
vite.config.js
index.html
```

## 本機測試

```bash
npm install
npm run dev
```

本機 Vite 測試不會自動執行 Vercel `/api` serverless functions。  
建議部署到 Vercel 測試正式 AI 功能。

## Vercel 部署設定

Framework Preset:

```text
Vite
```

Build Command:

```text
npm run build
```

Output Directory:

```text
dist
```

## Vercel Environment Variable

到：

```text
Vercel Project → Settings → Environment Variables
```

新增：

```text
Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxx
```

注意：

- Name 必須是 `OPENAI_API_KEY`
- 不要填 `VITE_OPENAI_API_KEY`
- 不要將 API Key 貼到 Name 欄位
- Value 才貼你的 sk-proj API Key

新增後要 Redeploy。

## 使用方法

1. 部署到 Vercel
2. 設定 `OPENAI_API_KEY`
3. Redeploy
4. 開網站
5. 設定頁可關閉 / 開啟 Demo 模式
6. 關閉 Demo 模式後，AI 會使用後端 API 連 OpenAI


## v2-stable 更新

這個版本修正：
- 按「AI 幫我揀」後長時間 loading
- 圖片生成過慢
- base64 圖片存入 localStorage 導致白屏
- 加入 API timeout
- 加入錯誤保護畫面

目前穩定版會先使用預設高質素食物圖，AI 文字建議仍然會經 `/api/food` 使用後端 OpenAI。
