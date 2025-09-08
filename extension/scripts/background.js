const extensionId = 'com.nbiobsp_native_web_ext';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== null && message.action !== undefined) {
        console.log("Message received from popup. Triggering background script...");
        sendNativeMessage(message.action);
        sendResponse({ status: "success", message: "Background script triggered!" });
    } else {
        console.log("No valid action found in the message.");
        console.log("Message: ", message);
    }
    return true;
});

async function sendNativeMessage(action) {
    let jsonMessage = {
        action: action
    };

    await chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
        console.warn("res:", res, "lastError:", chrome.runtime.lastError);
        if (!chrome.runtime.lastError && res['error'] === 0) {
            console.log('template:', res['data']['template']);
        }
    });
}
