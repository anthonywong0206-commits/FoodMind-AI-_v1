export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel Environment Variables" });
    }

    const { imageBase64 } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `你是食材辨識助手。請辨識圖片中的食材，只輸出 JSON：
{"items":[{"name":"食材名稱","category":"分類","quantity":"估算數量"}]}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "請辨識圖片中的食材。" },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Vision request failed", detail: data });
    }

    const content = data.choices?.[0]?.message?.content || "{\"items\":[]}";
    return res.status(200).json(JSON.parse(content));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
