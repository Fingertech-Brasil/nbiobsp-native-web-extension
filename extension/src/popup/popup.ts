document.addEventListener("DOMContentLoaded", async () => {
  const devicesDetected = document.querySelector("#devices-detected");

  let res = await window.sendMessageToExt("enum");
  if (res.status === "success") {
    let devices = res.data["device-count"];
    devicesDetected.innerHTML = "Devices Detected: " + devices;
  }

  const captureButton = document.querySelector("#capture");

  captureButton.addEventListener("click", () => {
    window.sendMessageToExt("capture");
  });

  const enrollButton = document.querySelector("#enroll");

  enrollButton.addEventListener("click", () => {
    window.sendMessageToExt("enroll");
  });
});
