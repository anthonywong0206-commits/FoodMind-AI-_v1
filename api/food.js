import { hkFoodDb } from "./data/hkFoodDb.js";

function foodDbText() {
  return Object.entries(hkFoodDb.categories)
    .map(([category, items]) => `${category}：${items.join("、")}`)
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel Environment Variables" });
    }

    const { form, settings, pantry = [] } = req.body || {};
    const pantryText = pantry.map((x) => `${x.name}(${x.quantity || "適量"})`).join("、") || "沒有";
    const blacklist = (settings?.blacklist || []).filter(Boolean).join("、") || "無";
    const whitelist = (settings?.whitelist || []).filter(Boolean).join("、") || "無";

    const systemPrompt = `
你是 FoodMind Cat Chef AI，一個專為香港環境設計的可愛貓主廚食物助手。請使用香港繁體中文及自然廣東話書面語。

核心任務：
根據用戶的用餐時間、心情、偏好、健康目標、黑白名單及食材庫，生成「香港人會覺得合理、日常、可執行」的食物建議。

【香港常見食物資料庫】
你必須優先從以下常見選擇中挑選或作合理微調，不要亂創奇怪菜式：
${foodDbText()}

【嚴格禁止】
${hkFoodDb.avoid_weird_combinations.map((x) => `- ${x}`).join("\n")}

【營養調整方向】
${hkFoodDb.nutrition_adjustments.map((x) => `- ${x}`).join("\n")}

【黑白名單】
- 絕對不要生成黑名單食物、食材或菜式：${blacklist}
- 可優先考慮白名單食物，但要合理、多元，不要每次相同：${whitelist}
- 如用戶輸入與黑名單衝突，請避開黑名單並給相近替代。

【健康設定】
健康飲食策略：${settings?.nutritionStrategy || "均衡飲食"}
每日卡路里目標：${settings?.calorieTarget || "無指定"}
每日蛋白質目標：${settings?.proteinTarget || "無指定"}
飲食偏好：${(settings?.dietPrefs || []).join("、") || "無"}
過敏設定：${(settings?.allergies || []).join("、") || "無"}
健康目標：${(settings?.healthGoals || []).join("、") || "無"}

【輸出要求】
- 菜名必須具體，例如「番茄牛肉通粉」「叉燒煎蛋飯」「蒸水蛋肉碎飯」。
- 不要提供附近餐廳。
- 不要提供熱門推介。
- 不要聲稱查到真實餐廳、距離、評分。
- 自己煮模式材料要香港超市/街市容易買到，步驟簡單。
- 營養數字要合理估算。
- catMessage 可愛但簡短。

只輸出 JSON：
{
  "title":"",
  "type":"",
  "meal":"",
  "reason":[],
  "ingredients":[{"name":"","amount":""}],
  "steps":[],
  "time":"",
  "difficulty":"",
  "nutrition":{"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0,"healthScore":0},
  "tips":"",
  "catMessage":""
}`;

    const userPrompt = `
用戶想食：${form?.craving || "未指定"}
用餐：${form?.meal || "午餐"}
方式：${form?.mode || "外賣"}
心情：${form?.mood || "未指定"}
食材庫：${pantryText}
地區：${settings?.location || "香港"}
個人口味：${(settings?.tastes || []).join("、") || "無"}
食物黑名單：${blacklist}
食物白名單：${whitelist}
請生成一個最合理的香港日常食物建議。
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.55,
        presence_penalty: 0.1,
        frequency_penalty: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "OpenAI request failed", detail: data });

    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
