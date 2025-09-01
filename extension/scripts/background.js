
const extensionId = 'com.enbiobsp.simple_biometric_native';
const jsonMessage = {
    action: "enroll"
};

async function sendNativeMessage() {
    await chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
        console.warn("res:", res, "lastError:", chrome.runtime.lastError);
        console.log('template:', res['data']['template']);
    });
}

sendNativeMessage();
