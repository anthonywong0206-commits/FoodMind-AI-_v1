# FoodMind v6 Cat Chef Ultimate

真正重構版：可愛貓主廚風格，保留現有功能。

## 保留功能
- 後端 OpenAI API：api/food.js
- Vision 食材辨識：api/vision.js
- AI 食物建議
- 自己煮 / 外賣模式
- 食材庫新增 / 修改 / 刪除
- 拍照 / 上載圖片辨識食材
- 飲食偏好、過敏、健康目標、口味設定
- Demo 模式
- Food History
- Weekly Meal Plan
- Smart Fridge 到期提醒

## 已移除頁面內容
- 首頁熱門推介
- 附近餐廳區塊
- 圖片生成功能

## Vercel 設定
Environment Variable:

Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxx

Build:
Framework: Vite
Build Command: npm run build
Output Directory: dist

更新後請 Redeploy without Build Cache。
