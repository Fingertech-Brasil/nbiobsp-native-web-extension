const devicesDetected = document.querySelector("#devices-detected");

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded and parsed");
    let devices = sendMessageToExt("enum");
    console.log("Connected devices:" + devices);
});

const button = document.querySelector("#capture");
button.addEventListener("click", async () => {
    sendMessageToExt("capture");
});

function sendMessageToExt(action) {
    return chrome.runtime.sendMessage({ action: action }, (response) => {
        console.log("Response from background:", response);
        return response;
    });
}
