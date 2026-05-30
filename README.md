# FoodMind AI v4｜高級餐廳菜單風格

此版本按照概念圖重新設計介面，並保留所有現有功能。

## 已保留功能

- 後端 OpenAI API：`api/food.js`
- Vision 食材辨識：`api/vision.js`
- AI 食物建議
- 自己煮 / 外賣模式
- 🍜 推薦菜式
- 📝 推薦原因
- 🥗 營養分析
- 📍 附近餐廳
- 食材庫新增 / 修改 / 刪除
- 拍照 / 上載圖片辨識食材
- 飲食偏好、過敏、健康目標、口味設定
- Demo 模式
- Food History
- Weekly Meal Plan
- Smart Fridge 到期提醒

## 已改介面

- 黑金高級餐廳菜單風
- 大按鈕
- 手機優先設計
- 少圖片、多文字
- AI 生成時金色動畫 loading
- 結果頁改成高級餐單排版

## Vercel 設定

Environment Variable：

```text
Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxx
```

Build 設定：

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

更新後請在 Vercel 使用：

```text
Redeploy without Build Cache
```
