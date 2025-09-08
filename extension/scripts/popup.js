const devicesDetected = document.querySelector("#devices-detected");

document.addEventListener("DOMContentLoaded", async () => {
    let res = await sendMessageToExt("enum");
    if (res.status === "success") {
        let devices = res.data["device-count"];
        document.querySelector("#devices-detected").innerHTML = "Devices Detected: " + devices;
    }
});

const button = document.querySelector("#capture");
button.addEventListener("click", () => {
    sendMessageToExt("capture");
});

async function sendMessageToExt(action) {
    let res = await chrome.runtime.sendMessage({ action: action });
    return res;
}
