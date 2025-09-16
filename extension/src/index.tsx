import { render } from "preact";
import { useState } from "preact/hooks";
import Button from "./components/Button";

import "./style.css";

export function App() {
  const [isCaptureLoading, setCaptureLoading] = useState(false);
  const [isEnrollLoading, setEnrollLoading] = useState(false);
  const [isEnumLoading, setEnumLoading] = useState(false);

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

  async function test(action: string) {
    sendMessageToExtension({ action: action }, (response: Object) => {
      let res = "";
      if (response["status"] === "error") {
        console.error("Error from extension:", response["message"]);
        res = "Error: " + response["message"];
        return;
      }
      console.log("Response from extension:", response);
      if (action === "enum")
        res = "devices detected: " + response["data"]["device-count"];
      else {
        res = "template: " + response["data"]["template"];
      }
      alert(res);
    });
    return;
  }

  return (
    <div className="bg-[#010016] h-full flex justify-center">
      <div className="max-w-md p-5 flex flex-col gap-3 my-auto h-1/2 border-2 border-[#05d7fc] rounded-md hover:text-shadow-[#05d7fc]">
        <h1 className="text-xl">Sample Page</h1>
        <h2 className="text-sm">
          This is a sample of how the extension would behave within a website
        </h2>
        <div className="flex flex-col gap-3 my-auto">
          <Button
            id="enum"
            text="Enumerate test"
            loading={isEnumLoading}
            onClick={() => {
              test("enum");
            }}
          />
          <Button
            id="capture"
            text="Capture test"
            loading={isCaptureLoading}
            onClick={() => {
              test("capture");
            }}
          />
          <Button
            id="enroll"
            text="Enroll test"
            loading={isEnrollLoading}
            onClick={() => {
              test("enroll");
            }}
          />
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));
