
const extensionId = 'com.enbiobsp.simple_biometric_native';
const jsonMessage = {
    action: "enroll"
};

chrome.runtime.sendNativeMessage(extensionId, jsonMessage, function (res) {
    console.warn(res, chrome.runtime.lastError);
    console.log('template:', res['data']['template']);
});