const test = document.getElementById("test");

if (test) {
  test.addEventListener("click", async () => {
    let res = await window.sendMessageToExt("enum");
    if (res.status === "success") {
      let devices = res.data["device-count"];
      alert("Devices Detected: " + devices);
    }
  });
} else {
  console.log("Button with id 'test' not found.");
}
