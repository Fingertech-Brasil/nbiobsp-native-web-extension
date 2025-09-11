const devicesDetected = document.querySelector("#devices-detected");

document.addEventListener("DOMContentLoaded", async () => {
  let res = await sendMessageToExt("enum");
  if (res.status === "success") {
    let devices = res.data["device-count"];
    document.querySelector("#devices-detected").innerHTML =
      "Devices Detected: " + devices;
  }

  const captureButton = document.querySelector("#capture");

  captureButton.addEventListener("click", () => {
    sendMessageToExt("capture");
  });

  const enrollButton = document.querySelector("#enroll");

  enrollButton.addEventListener("click", () => {
    sendMessageToExt("enroll");
  });
});

async function sendMessageToExt(action: string) {
  let res = await chrome.runtime.sendMessage({ action: action });
  return res;
}
