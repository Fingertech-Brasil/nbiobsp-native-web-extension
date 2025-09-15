const extensionId = "com.nbiobsp_native_web_ext";

async function sendNativeMessage(action: string) {
  let jsonMessage = {
    action: action,
  };

  let data = await new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
      console.warn("res:", res, "lastError:", chrome.runtime.lastError);
      if (!chrome.runtime.lastError) {
        resolve(res["data"]);
        return;
      }
      reject(new Error(chrome.runtime.lastError.message));
    });
  });
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
        let data = await sendNativeMessage(message.action);
        if (!data) {
          throw new Error("No data received from native app");
        }
        console.log("Data from native app:", data);
        sendResponse({
          status: "success",
          message: "Background script triggered!",
          data: data,
        });
      } else {
        console.log("No valid action found in the message: ", message);
        sendResponse({ status: "error", message: "Invalid action" });
      }
    } catch (error) {
      console.error("Error in background script:", error);
      sendResponse({ status: "error", message: error.message });
    }
  })();
  return true;
}

// Listener for messages from the popup
chrome.runtime.onMessage.addListener(callBacker);

// Listener for messages from the website
chrome.runtime.onMessageExternal.addListener(callBacker);
