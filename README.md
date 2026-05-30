# FoodMind v7 Cat Chef Nutrition

在 v6 Cat Chef Ultimate 基礎上更新：

## 新增 / 修改
- 底部「餐單」改為「營養」
- 新增「營養管理」頁
- 用戶可自訂健康飲食策略
- 用戶可設定每日卡路里目標
- 用戶可設定每日蛋白質目標
- AI 生成一週營養餐單
- 一週餐單顯示每日早餐 / 午餐 / 晚餐 / 小食
- 每日顯示 calories、protein、carbs、healthScore
- 我的頁面新增食物黑名單
- 我的頁面新增食物白名單
- AI 生成食物建議及一週餐單時會避開黑名單，優先考慮白名單

## 保留功能
- AI 貓主廚食物建議
- 自己煮 / 外賣
- 食材庫
- 拍照食材辨識
- 偏好設定
- Demo 模式
- Food History
- OpenAI 後端 API

## 新增 API
- api/mealplan.js

## Vercel
Environment Variable:

Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxx

更新後請使用 Redeploy without Build Cache。
