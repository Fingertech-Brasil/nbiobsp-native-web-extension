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
      if (error.message.includes("host not found")) {
        alertActiveTab(
          `${chrome.i18n.getMessage("background_installPrompt")}`,
          "https://fingertech.com.br/download/Nitgen/Hamster/Windows/NBioBSP Extension Setup.zip"
        );
      }
      sendResponse({ status: "error", message: error.message });
    }
  })();
  return true;
}

// Listener for messages from the popup
chrome.runtime.onMessage.addListener(callBacker);

// Listener for messages from the website
chrome.runtime.onMessageExternal.addListener(callBacker);

function alertActiveTab(text: string, url: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId != null) {
      chrome.tabs.sendMessage(tabId, { type: "ALERT", text, url });
    }
  });
}
