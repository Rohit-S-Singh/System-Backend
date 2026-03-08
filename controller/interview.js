app.post("/create-interview", async (req, res) => {
    try {
      const response = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId: process.env.VAPI_ASSISTANT_ID,
        }),
      });
  
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });
  