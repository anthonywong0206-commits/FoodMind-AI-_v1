# FoodMind AI v4｜香港口味優化版

此版本保留原有高級餐廳菜單風格及所有功能，並更新 AI 生成內容，令建議更貼近香港人口味及更有多元化。

## 今次更新

- AI Prompt 改為香港飲食取向
- 加入茶餐廳 / 冰室 / 燒味 / 兩餸飯 / 車仔麵 / 米線 / 雲吞麵 / 牛腩麵 / 粥粉麵 / 點心 / 煲仔飯 / 焗豬扒飯等香港常見選擇
- 加入日式、韓式、泰式、越式、星馬、台灣、印度、西式、健康飯盒等多元選擇
- 外賣建議更似 OpenRice 分類邏輯
- 自己煮模式會更優先使用食材庫材料
- 會根據早餐 / 午餐 / 晚餐 / 宵夜調整建議
- 會根據健康目標提供少汁、少糖、加菜、半飯、轉糙米等建議
- 避免每次生成都只推薦同一類食物

## 保留功能

- AI 食物建議
- 自己煮 / 外賣
- 食材庫
- 拍照辨識食材
- 飲食偏好 / 過敏 / 健康目標 / 個人口味
- Food History
- Weekly Meal Plan
- Smart Fridge
- 後端 API：`api/food.js`
- Vision API：`api/vision.js`

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

更新後請使用：

```text
Redeploy without Build Cache
```
