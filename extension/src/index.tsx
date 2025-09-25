import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import Button from "./components/Button";
import "./i18n";
import { useTranslation } from "preact-i18next";

import "./style.css";

export function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(navigator.language || "en");
  }, []);

  const [isCaptureLoading, setCaptureLoading] = useState(false);
  const [isEnrollLoading, setEnrollLoading] = useState(false);
  const [isEnumLoading, setEnumLoading] = useState(false);
  const [isVerifyLoading, setVerifyLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [template, setTemplate] = useState("");
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

  function switchActionLoading(action: string, state: boolean) {
    switch (action) {
      case "enum":
        setEnumLoading(state);
        break;
      case "capture":
        setCaptureLoading(state);
        break;
      case "enroll":
        setEnrollLoading(state);
        break;
      case "verify":
        setVerifyLoading(state);
        break;
    }
  }

  async function test(action: string, body: Object = {}) {
    sendMessageToExtension(
      { action: action, body: body },
      (response: Object) => {
        let res = "";
        if (response["status"] === "error") {
          console.error("Error from extension:", res);
          res = response["message"];
        } else {
          console.log("Response from extension:", response);
          if (response["data"]["device-count"]) {
            res = `${t("devicesDetected")}: ${
              response["data"]["device-count"]
            }`;
            setDeviceCount(response["data"]["device-count"]);
          } else if (response["data"]["template"]) {
            res = "Template generated.";
            setTemplate(response["data"]["template"] || "");
          } else {
            res = response["data"]["result"]
              ? "Verification successful."
              : "Verification failed.";
          }
        }
        setMessage(res);
        switchActionLoading(action, false);
      }
    );
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
          <p className="overflow-hidden text-ellipsis text-nowrap">
            Template: {template}
          </p>
          <Button
            id="verify"
            text={`${t("test")} ${t("verify")}`}
            loading={isVerifyLoading}
            onClick={() => {
              setVerifyLoading(true);
              test("verify", {
                template: template,
              });
            }}
          />
        </div>
        <p className="overflow-hidden text-ellipsis text-nowrap">{message}</p>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));
