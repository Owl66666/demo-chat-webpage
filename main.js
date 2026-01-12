const res = await fetch("https://demo-chat-worker.zchong517.workers.dev/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: text }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder("utf-8");

let buffer = "";
let assistantText = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // 按 SSE 事件拆分
  const lines = buffer.split("\n");
  buffer = lines.pop(); // 留下未完整的一行

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;

    const data = line.replace("data:", "").trim();

    if (data === "[DONE]") {
      return;
    }

    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta?.content;

      if (delta) {
        assistantText += delta;
        botDiv.textContent = assistantText;
        chat.scrollTop = chat.scrollHeight;
      }
    } catch (e) {
      console.error("JSON parse error:", data);
    }
  }
}
