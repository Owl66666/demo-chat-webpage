const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const messages = document.getElementById("messages");

// 点击发送
sendBtn.addEventListener("click", sendMessage);

// Enter 发送，Shift+Enter 换行
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  sendBtn.disabled = true;

  // 用户消息
  addMessage(text, "user");

  // AI 消息占位
  const botMsgEl = addMessage("", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 以 \n\n 分隔事件
      const events = buffer.split("\n\n");
      buffer = events.pop(); // 未完整部分留到下次

      for (const event of events) {
        const line = event.trim();

        if (!line.startsWith("data:")) continue;

        const data = line.replace(/^data:\s*/, "");

        if (data === "[DONE]") {
          sendBtn.disabled = false;
          return;
        }

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            botMsgEl.textContent += delta;
            scrollToBottom();
          }
        } catch (e) {
          // JSON 不完整时忽略
        }
      }
    }
  } catch (err) {
    botMsgEl.textContent += "\n[请求失败]";
    console.error(err);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}
