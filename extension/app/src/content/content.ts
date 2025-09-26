chrome.runtime.onMessage.addListener((msg) => {
  if (
    msg?.type === "ALERT" &&
    typeof msg.text === "string" &&
    typeof msg.url === "string"
  ) {
    const box = document.createElement("div");
    box.style.cssText = [
      "position: absolute",
      "left: calc(50vw - 200px)",
      "top: 16px",
      "z-index: 999999",
      "background: #111",
      "padding: 12px 14px",
      "text-align: center",
      "border-radius: 8px",
      "box-shadow: 0 6px 20px rgba(0,0,0,.35)",
      "width: 400px",
    ].join(";");
    const link = document.createElement("a");
    link.href = msg.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = msg.text;
    link.style.cssText =
      "color:#05d7fc;text-decoration:underline;word-break:break-word";
    const close = document.createElement("button");
    close.textContent = "×";
    close.style.cssText =
      "margin-left:8px;background:transparent;border:0;color:#aaa;cursor:pointer;font-size:16px";
    close.onclick = () => box.remove();
    box.append(" ", link, " ", close);
    document.documentElement.appendChild(box);
  }
});
