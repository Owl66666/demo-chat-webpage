const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const messages = document.getElementById("messages");

const WORKER_URL = "https://demo-chat-worker.zchong517.workers.dev";

/* 工具函数：添加一条消息 */
function addMessage(role, text = "") {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

/* 发送消息（核心） */
async function sendMessage() {
  const content = input.value.trim();
  if (!content) return;

  input.value = "";
  sendBtn.disabled = true;

  // 用户消息
  addMessage("user", content);

  // AI 消息（占位，用于流式填充）
  const botDiv = addMessage("bot", "");

  const resp = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: content }),
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 按 SSE 规范分行
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;

      const data = line.replace("data:", "").trim();
      if (data === "[DONE]") continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          botDiv.textContent += delta;
          messages.scrollTop = messages.scrollHeight;
        }
      } catch {
        // 忽略解析失败的 chunk
      }
    }
  }

  sendBtn.disabled = false;
}

/* 点击按钮发送 */
sendBtn.addEventListener("click", sendMessage);

/* Enter 发送 / Shift+Enter 换行 */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // 阻止 textarea 换行
    sendMessage();
  }
});
