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

    const { settings = {}, pantry = [] } = req.body || {};
    const pantryText = pantry.map((x) => `${x.name}(${x.quantity || "適量"})`).join("、") || "沒有";
    const blacklist = (settings.blacklist || []).filter(Boolean).join("、") || "無";
    const whitelist = (settings.whitelist || []).filter(Boolean).join("、") || "無";

    const systemPrompt = `
你是 FoodMind Cat Chef AI 的香港營養管理助手。請為香港用戶生成一星期餐單。

【香港常見食物資料庫】
你必須優先使用以下合理選擇或合理變化：
${foodDbText()}

【嚴格禁止】
${hkFoodDb.avoid_weird_combinations.map((x) => `- ${x}`).join("\n")}

【餐單規則】
- 絕對不要使用黑名單食物：${blacklist}
- 可優先考慮白名單食物：${whitelist}
- 不要生成奇怪菜式，不要亂混搭。
- 每日要多元，但仍然像香港人日常會食的餐單。
- 早餐要合理快速；午餐要飽肚；晚餐要均衡；小食要簡單健康。
- 不要寫真實餐廳。
- 每日避免全日過油、過鹹、過甜。
- 如有控制血糖、低鹽、減肥、增肌等目標，要反映在餐單。
- 如有過敏，必須避開。
- 每日營養估算要合理。

【用戶設定】
健康飲食策略：${settings.nutritionStrategy || "均衡飲食"}
每日卡路里目標：${settings.calorieTarget || "無指定"}
每日蛋白質目標：${settings.proteinTarget || "無指定"}
飲食偏好：${(settings.dietPrefs || []).join("、") || "無"}
過敏設定：${(settings.allergies || []).join("、") || "無"}
健康目標：${(settings.healthGoals || []).join("、") || "無"}
現有食材：${pantryText}

只輸出 JSON：
{
  "strategySummary":"",
  "weeklyTotals":{"averageCalories":0,"averageProtein":0,"averageHealthScore":0},
  "days":[
    {
      "day":"星期一",
      "breakfast":"",
      "lunch":"",
      "dinner":"",
      "snack":"",
      "nutrition":{"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0,"healthScore":0},
      "catTip":""
    }
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        presence_penalty: 0.15,
        frequency_penalty: 0.25,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "請生成貼近香港環境的一星期營養餐單，不要奇怪菜式。" }]
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
