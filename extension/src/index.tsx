import { render } from "preact";
import { useState } from "preact/hooks";
import Button from "./components/Button";
import "./i18n";
import { useTranslation } from "preact-i18next";

import "./style.css";

export function App() {
  const { t } = useTranslation();

  const [isCaptureLoading, setCaptureLoading] = useState(false);
  const [isEnrollLoading, setEnrollLoading] = useState(false);
  const [isEnumLoading, setEnumLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [message, setMessage] = useState("");

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
        res = response["message"];
        console.error("Error from extension:", response["message"]);
      } else {
        console.log("Response from extension:", response);
        if (action === "enum") {
          res = `${t("devicesDetected")}: ${response["data"]["device-count"]}`;
          setDeviceCount(response["data"]["device-count"]);
        } else {
          res = `Template: ${response["data"]["template"]}`;
        }
      }
      setMessage(res);
      switch (action) {
        case "enum":
          setEnumLoading(false);
          break;
        case "capture":
          setCaptureLoading(false);
          break;
        case "enroll":
          setEnrollLoading(false);
          break;
      }
    });
    return;
  }

  return (
    <div className="bg-[#010016] min-h-full flex justify-center">
      <div className="max-w-md p-5 flex flex-col gap-3 my-auto border-2 border-[#05d7fc] rounded-md hover:text-shadow-[#05d7fc]">
        <h1 className="text-xl">{t("index:title")}</h1>
        <h2 className="text-sm">{t("index:desc")}</h2>
        <div className="flex flex-col gap-3 my-auto">
          <Button
            id="enum"
            text={`${t("test")} ${t("enum")}`}
            loading={isEnumLoading}
            onClick={() => {
              setEnumLoading(true);
              test("enum");
            }}
          />
          <p>
            {t("devices")}: {deviceCount}
          </p>
          <Button
            id="capture"
            text={`${t("test")} ${t("capture")}`}
            loading={isCaptureLoading}
            onClick={() => {
              setCaptureLoading(true);
              test("capture");
            }}
          />
          <Button
            id="enroll"
            text={`${t("test")} ${t("enroll")}`}
            loading={isEnrollLoading}
            onClick={() => {
              setEnrollLoading(true);
              test("enroll");
            }}
          />
        </div>
        <p className="overflow-hidden text-ellipsis text-nowrap">{message}</p>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));
