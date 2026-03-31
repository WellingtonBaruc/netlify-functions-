const https = require("https");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  try {
    const { messages } = JSON.parse(event.body);
    const userMessage = messages[0].content;

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
    });

    return new Promise((resolve) => {
      const apiKey = "AIzaSyAsJF4HYbeZjiNYaA5AbsuAqVgFP2-_2Yo";
      const options = {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(geminiBody),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            const geminiResponse = JSON.parse(data);
            const text = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
            // Format as Anthropic-compatible response
            const anthropicFormat = {
              content: [{ type: "text", text: text }]
            };
            resolve({
              statusCode: 200,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(anthropicFormat),
            });
          } catch(e) {
            resolve({
              statusCode: 200,
              headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
              body: JSON.stringify({ content: [{ type: "text", text: data }] }),
            });
          }
        });
      });

      req.on("error", (err) => {
        resolve({
          statusCode: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: err.message }),
        });
      });

      req.write(geminiBody);
      req.end();
    });
  } catch(err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
