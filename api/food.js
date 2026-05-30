export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel Environment Variables" });
    }

    const { form, settings, pantry = [] } = req.body || {};
    const pantryText = pantry.map((x) => `${x.name}(${x.quantity || "適量"})`).join("、");
    const blacklist = (settings?.blacklist || []).filter(Boolean).join("、") || "無";
    const whitelist = (settings?.whitelist || []).filter(Boolean).join("、") || "無";
    const nutritionStrategy = settings?.nutritionStrategy || "均衡飲食";
    const calorieTarget = settings?.calorieTarget || "";
    const proteinTarget = settings?.proteinTarget || "";

    const systemPrompt = `
你是 FoodMind Cat Chef AI，一個可愛貓主廚食物助手。請使用香港繁體中文及自然廣東話書面語。

重要規則：
1. 生成內容要貼近香港人口味，涵蓋茶餐廳、兩餸飯、燒味、米線、車仔麵、雲吞麵、牛腩麵、粥粉麵、點心、煲仔飯、焗豬扒飯、日式、韓式、泰式、越式、台式、健康飯盒等。
2. 不要提供附近餐廳或熱門推介。
3. 絕對不要生成黑名單食物、食材或菜式：${blacklist}
4. 優先考慮白名單喜好，但不要每次都完全相同：${whitelist}
5. 必須配合健康飲食策略：${nutritionStrategy}
6. 如有卡路里目標，建議應合理貼近：${calorieTarget || "無指定"}
7. 如有蛋白質目標，建議應合理貼近：${proteinTarget || "無指定"}
8. 如有過敏設定，必須避開。
9. 營養資料是估算，務實即可。
10. 語氣像可愛貓主廚，但內容要實用。

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
食材庫：${pantryText || "沒有"}
地區：${settings?.location || "香港"}
飲食偏好：${(settings?.dietPrefs || []).join("、") || "無"}
過敏：${(settings?.allergies || []).join("、") || "無"}
健康目標：${(settings?.healthGoals || []).join("、") || "無"}
個人口味：${(settings?.tastes || []).join("、") || "無"}
健康飲食策略：${nutritionStrategy}
每日卡路里目標：${calorieTarget || "無"}
每日蛋白質目標：${proteinTarget || "無"}
食物黑名單：${blacklist}
食物白名單：${whitelist}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        presence_penalty: 0.35,
        frequency_penalty: 0.25,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "OpenAI request failed", detail: data });
    return res.status(200).json(JSON.parse(data.choices?.[0]?.message?.content || "{}"));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
