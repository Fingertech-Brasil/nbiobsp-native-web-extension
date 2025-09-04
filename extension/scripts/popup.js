const button = document.querySelector("button");
button.addEventListener("click", async () => {
    sendMessageToExt();
});

function sendMessageToExt() {
    chrome.runtime.sendMessage({ action: "triggerBackgroundScript" }, (response) => {
        console.log("Response from background:", response);
    });
}
