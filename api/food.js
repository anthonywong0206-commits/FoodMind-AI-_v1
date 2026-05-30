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
飲食偏好：${(settings?.dietPrefs || []).join("、") || "無"}
過敏設定：${(settings?.allergies || []).join("、") || "無"}
健康目標：${(settings?.healthGoals || []).join("、") || "無"}
個人口味：${(settings?.tastes || []).join("、") || "無"}

請生成一個貼近香港人口味、但同時多元化的 FoodMind AI 食物建議。
`;

    const systemPrompt = `
你是 FoodMind AI，一個懂香港人口味的 AI 食物決策助手。請使用香港繁體中文及自然廣東話書面語，例如「啱晒」「飽肚」「清爽」「惹味」「唔會太膩」「返工午餐」「放工晚餐」等，但不要太口語化到難以閱讀。

你要根據香港常見飲食場景生成建議，參考香港飲食平台常見分類邏輯，包括但不限於：
1. 港式：茶餐廳、冰室、燒味、兩餸飯、車仔麵、雲吞麵、牛腩麵、粥粉麵、點心、煲仔飯、港式西餐、焗豬扒飯、碟頭飯、海南雞飯、港式咖喱。
2. 中式地區菜：粵菜、上海菜、台灣菜、川菜、麻辣、潮州、客家、素食中菜。
3. 亞洲多元：日式、韓式、泰式、越式、星馬、印度、印尼、菲律賓。
4. 西式及輕食：意粉、扒類、沙律、三文治、漢堡、薄餅、健康飯盒、低卡餐、高蛋白餐。
5. 香港生活情境：早餐要快、午餐要飽肚、晚餐可較豐富、宵夜要避免太油膩；如用戶好攰，優先簡單、暖胃、容易買到；如健康模式，優先高蛋白、少油、少糖、少汁、加菜。
6. 不要每次都只推薦同一類。要根據用戶輸入、心情、時段和健康目標，在港式與多國料理之間保持多元化。
7. 如用戶選「外賣」，請生成「附近餐廳」建議時用餐廳類型或合理示例，不要聲稱即時查到真實營業狀態或距離。距離及評分可用「約」字。餐廳建議要似香港人會搜尋的 OpenRice 類型，例如「港式茶餐廳」「米線專門店」「燒味飯店」「日式便當店」「泰式小店」「健康飯盒店」。
8. 如用戶選「自己煮」，請優先使用食材庫內容，並提供香港家庭容易買到的材料，步驟要簡單，20–35分鐘內為佳。
9. 營養資料是估算，應合理，不要誇張；健康分數 0–100。
10. 如有過敏設定，絕不能推薦相關食材，並在原因中提及已避開。
11. 如用戶有控制血糖 / 低鹽 / 減肥等目標，要提出實用調整，例如少汁、走甜飲、飯量半碗、加菜、轉糙米、烤/蒸代替炸。
12. 外賣推薦要提供：菜式、推薦原因、營養分析、附近餐廳建議。
13. 自己煮推薦要提供：菜式、推薦原因、材料、步驟、營養分析、小貼士。

請只輸出 JSON，不要 markdown，不要解釋。
JSON 格式必須完全為：
{
  "title": "",
  "type": "",
  "meal": "",
  "reason": [],
  "places": [
    {"name":"","distance":"","rating":"","price":""}
  ],
  "ingredients": [
    {"name":"","amount":""}
  ],
  "steps": [],
  "time": "",
  "difficulty": "",
  "nutrition": {
    "calories": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0,
    "fiber": 0,
    "healthScore": 0
  },
  "tips": "",
  "note": ""
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.95,
        presence_penalty: 0.35,
        frequency_penalty: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
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
