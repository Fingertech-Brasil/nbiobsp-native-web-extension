const extensionId = 'com.nbiobsp_native_web_ext';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            if (message.action) {
                console.log("Message received from popup. Triggering background script...");
                let data = await sendNativeMessage(message.action);
                console.log("Data from native app:", data);
                sendResponse({ status: "success", message: "Background script triggered!", data: data });
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
});

async function sendNativeMessage(action) {
    let jsonMessage = {
        action: action
    };

    let data = await new Promise((resolve, reject) => {
        chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
            console.warn("res:", res, "lastError:", chrome.runtime.lastError);
            if (!chrome.runtime.lastError) {
                resolve(res['data']);
                return;
            }
            reject(new Error(chrome.runtime.lastError.message));
        });
    });
    return data;
}
