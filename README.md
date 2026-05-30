# FoodMind v7.1 Cat Chef HK Food Database

改良 AI 生成答案及資料庫，令內容更貼近香港環境，避免生成奇怪菜式。

## 今次更新
- 新增香港常見食物資料庫：api/data/hkFoodDb.js
- AI 優先使用香港合理菜式
- 降低亂創奇怪菜式機會
- 加強黑名單 / 白名單規則
- 優化單次食物建議 Prompt：api/food.js
- 優化一週營養餐單 Prompt：api/mealplan.js
- 生成更貼近香港日常：
  - 茶餐廳
  - 兩餸飯
  - 燒味
  - 米線
  - 車仔麵
  - 雲吞麵
  - 牛腩麵
  - 粥粉麵
  - 焗豬扒飯
  - 家常蒸魚 / 蒸水蛋 / 豆腐肉碎
  - 日韓泰越台式常見餐點
  - 健康飯盒

## 保留功能
- AI 貓主廚食物建議
- 營養管理
- 一週餐單
- 黑名單 / 白名單
- 食材庫
- 拍照辨識
- Demo 模式
- Food History

## Vercel
Environment Variable:

Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxx

更新後請使用 Redeploy without Build Cache。
