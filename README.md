# FoodMind AI v3｜純文字 AI 版

這個版本已刪除所有 AI 生成圖片功能，只保留文字內容：

- 🍜 推薦菜式
- 📝 推薦原因
- 🥗 營養分析
- 📍 附近餐廳
- 自己煮食譜
- 食材庫
- 拍照食材辨識
- Weekly Meal Plan
- Smart Fridge

## 專案結構

```text
api/
  food.js
  vision.js
src/
  App.jsx
  main.jsx
  index.css
package.json
vite.config.js
index.html
```

## Vercel 設定

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

## Environment Variable

到 Vercel：

```text
Project → Settings → Environment Variables
```

新增：

```text
Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxx
```

記得新增後要 Redeploy。

## 更新方法

1. 解壓 ZIP
2. 將所有檔案覆蓋 GitHub repo 最外層
3. 確保最外層有：
   - api/
   - src/
   - package.json
   - index.html
   - vite.config.js
4. Vercel → Deployments → Redeploy without Build Cache
