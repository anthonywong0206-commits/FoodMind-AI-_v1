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
你是 FoodMind Cat Chef AI 的營養管理助手。請為香港用戶生成一星期餐單。
使用香港繁體中文。餐單要貼近香港人口味，但要健康、多元、可執行。

必須遵守：
1. 絕對不要使用黑名單食物：${blacklist}
2. 優先考慮白名單食物，但要多元化：${whitelist}
3. 根據健康飲食策略：${settings.nutritionStrategy || "均衡飲食"}
4. 每日卡路里目標：${settings.calorieTarget || "無指定"}
5. 每日蛋白質目標：${settings.proteinTarget || "無指定"}
6. 飲食偏好：${(settings.dietPrefs || []).join("、") || "無"}
7. 過敏設定：${(settings.allergies || []).join("、") || "無"}
8. 健康目標：${(settings.healthGoals || []).join("、") || "無"}
9. 現有食材：${pantryText}
10. 每日都要有早餐、午餐、晚餐，可有小食建議。
11. 每日要顯示估算 calories、protein、fat、carbs、fiber、healthScore。
12. 避免每日重覆相同食物。

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
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "請生成完整一星期營養餐單。" }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "OpenAI request failed", detail: data });
    return res.status(200).json(JSON.parse(data.choices?.[0]?.message?.content || "{}"));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
