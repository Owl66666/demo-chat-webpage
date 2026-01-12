const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // 用户消息
  addMessage(text, "user");
  input.value = "";

  // 机器人消息占位（重点）
  const botDiv = addMessage("", "bot");

  try {
    const res = await fetch("https://demo-chat-worker.zchong517.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    if (!res.body) {
      botDiv.textContent = "浏览器不支持流式响应";
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        botDiv.textContent = buffer;
        chat.scrollTop = chat.scrollHeight;
      }
    }
  } catch (e) {
    botDiv.textContent = "请求失败，请检查 Worker";
    console.error(e);
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
