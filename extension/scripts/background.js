
const extensionId = 'com.nbiobsp_native_web_ext';
const jsonMessage = {
    action: "capture"
};

async function sendNativeMessage() {
    await chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
        console.warn("res:", res, "lastError:", chrome.runtime.lastError);
        if (!chrome.runtime.lastError && res['error'] === 0) {
            console.log('template:', res['data']['template']);
        }
    });
}

sendNativeMessage();
