const extensionId = "com.nbiobsp_native_web_ext";

let busy: Object = {};

async function sendNativeMessage(action: string, body: any) {
  let jsonMessage = {
    action: action,
    body: body || {},
  };

  let data = await new Promise((resolve, reject) => {
    if (busy[action]) {
      reject(new Error(chrome.i18n.getMessage("background_busy")));
      return;
    }
    busy[action] = true;
    chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
      if (!chrome.runtime.lastError) {
        resolve(res["data"]);
        return;
      }
      busy[action] = false;
      reject(new Error(chrome.runtime.lastError.message));
    });
  });
  busy[action] = false;
  return data;
}

function callBacker(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: Function
) {
  (async () => {
    try {
      if (sender.tab?.url) {
        const origin = new URL(sender.tab.url).origin + "/*";
        console.log("Requesting permission for origin:", origin);
        chrome.permissions.request({ origins: [origin] }, (granted) => {
          if (!granted) {
            throw new Error(
              chrome.i18n.getMessage("background_permissionDenied")
            );
          }
        });
      }

      if (message.action) {
        let data = await sendNativeMessage(message.action, message.body ?? {});
        if (!data) {
          throw new Error(chrome.i18n.getMessage("background_noDataReceived"));
        }
        console.log("Data from native app:", data);
        sendResponse({
          status: "success",
          message: chrome.i18n.getMessage("background_operationSuccessful"),
          data: data,
        });
      } else {
        console.log("No valid action found in the message: ", message);
        sendResponse({
          status: "error",
          message: chrome.i18n.getMessage("background_invalidAction"),
        });
      }
    } catch (error) {
      console.error("Error in background script:", error);
      if (error.message.includes("host")) {
        let url =
          "https://fingertech.com.br/download/Nitgen/Hamster/Windows/NBioBSP Extension Setup.zip";
        if (sender.tab?.id) {
          chrome.scripting.executeScript({
            target: { tabId: sender.tab!.id! },
            func: alertActiveTab,
            args: [chrome.i18n.getMessage("background_installPrompt"), url],
          });
        } else {
          sendResponse({
            status: "error",
            message: chrome.i18n.getMessage("background_installPrompt"),
            url: url,
          });
        }
      }
      sendResponse({
        status: "error",
        message: chrome.i18n.getMessage("background_operationFailed"),
      });
    }
  })();
  return true;
}

chrome.runtime.onMessage.addListener(callBacker);

function alertActiveTab(text: string, url: string) {
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
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = text;
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
