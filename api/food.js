export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel Environment Variables" });
    }

    const { form, settings, pantry = [] } = req.body || {};

    const pantryText = pantry.map((x) => `${x.name}(${x.quantity || "適量"})`).join("、");

    const userPrompt = `
用戶想食：${form?.craving || "未指定"}
用餐時段：${form?.meal || "午餐"}
飲食方式：${form?.mode || "外賣"}
今日心情：${form?.mood || "未指定"}
食材庫：${pantryText || "沒有"}
地區：${settings?.location || "香港"}
圖片風格：${settings?.imageStyle || "超寫實美食攝影"}
飲食偏好：${(settings?.dietPrefs || []).join("、") || "無"}
過敏設定：${(settings?.allergies || []).join("、") || "無"}
健康目標：${(settings?.healthGoals || []).join("、") || "無"}
個人口味：${(settings?.tastes || []).join("、") || "無"}

請生成一個 FoodMind AI 食物建議。
如果飲食方式是「外賣」，請提供推薦菜式、推薦原因、推薦地點、營養分析及圖片生成 prompt。
如果飲食方式是「自己煮」，請提供建議菜式、材料清單、製作步驟、烹調時間、難度、營養分析及圖片生成 prompt。
請使用香港繁體中文。
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `你是 FoodMind AI，一個香港用語的 AI 食物決策助手。只輸出 JSON，不要 markdown。
JSON 格式必須為：
{
  "title": "",
  "type": "",
  "meal": "",
  "reason": [],
  "places": [{"name":"","distance":"","rating":"","price":""}],
  "ingredients": [{"name":"","amount":""}],
  "steps": [],
  "time": "",
  "difficulty": "",
  "nutrition": {"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0,"healthScore":0},
  "tips": "",
  "imagePrompt": ""
}`
          },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "OpenAI request failed", detail: data });
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    return res.status(200).json(JSON.parse(content));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
