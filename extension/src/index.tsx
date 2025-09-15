import { render } from "preact";
import Button from "./components/Button";

import "./style.css";

export function App() {
  return (
    <div className="bg-[#010016] h-full flex justify-center">
      <div className="max-w-md p-5 flex flex-col gap-3 my-auto h-1/2 border-2 border-[#05d7fc] rounded-md hover:text-shadow-[#05d7fc]">
        <h1 className="text-xl">Sample Page</h1>
        <h2 className="text-sm">
          This is a sample of how the extension would behave within a website
        </h2>
        <div className="flex flex-col gap-3 my-auto">
          <Button id="enum" text="Enumerate test" />
          <Button id="capture" text="Capture test" />
          <Button id="enroll" text="Enroll test" />
        </div>
      </div>
    </div>
  );
}

const extensionId = "klgconhcnhijgogiakodhimlpljalhoi";

// Send a message to the extension
function sendMessageToExtension(message: Object, callback: Function) {
  chrome.runtime.sendMessage(extensionId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error:", chrome.runtime.lastError.message);
      return;
    } else {
      callback(response);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const testEnum = document.getElementById("enum");
  const testCapture = document.getElementById("capture");
  const testEnroll = document.getElementById("enroll");

  function test(action: string) {
    sendMessageToExtension({ action: action }, (response: Object) => {
      if (response["status"] === "error") {
        console.error("Error from extension:", response["message"]);
        alert("Error: " + response["message"]);
        return;
      }
      console.log("Response from extension:", response);
      if (action === "enum")
        alert("devices detected: " + response["data"]["device-count"]);
      else {
        alert("template: " + response["data"]["template"]);
      }
    });
  }

  testEnum.onclick = () => {
    test("enum");
  };
  testCapture.onclick = () => {
    test("capture");
  };
  testEnroll.onclick = () => {
    test("enroll");
  };
});

render(<App />, document.getElementById("app"));
