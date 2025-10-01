import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button } from "@nbiobsp-native-web-extension/shared";
import "./i18n";
import { useTranslation } from "preact-i18next";

import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "./prism-custom.css";

import "@nbiobsp-native-web-extension/shared/styles";

export function App() {
  const { t, i18n } = useTranslation();

  const [isCaptureLoading, setCaptureLoading] = useState(false);
  const [isEnrollLoading, setEnrollLoading] = useState(false);
  const [isVerifyLoading, setVerifyLoading] = useState(false);
  const [isEnumLoading, setEnumLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(navigator.language || "en");
  }, []);

  // Send a message to the extension
  function sendMessageToExtension(message: Object) {
    window.postMessage({ type: "fromPage", message: message }, "*");
  }

  // Listen for messages from the extension
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source === window && event.data.type === "fromExtension") {
        let response = event.data.body;
        let res = "";
        if (response["status"] === "error") {
          console.error("Error from extension:", res);
          res = response["message"];
        } else {
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
        switchActionLoading(event.data.action, false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  });

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
    sendMessageToExtension({ action: action, body: body });
    return;
  }

  const snippet = `
// Send a message to the extension
function sendMessageToExtension(message: Object) {
  window.postMessage({ type: "fromPage", message: message }, "*");
}

// Listen for messages from the extension
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.source === window && event.data.type === "fromExtension") {
      let response = event.data.body;
      let res = "";
      if (response["status"] === "error") {
        console.error("Error from extension:", res);
        res = response["message"];
      } else {
        if (response["data"]["device-count"]) {
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
    }
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
});
`;

  return (
    <div className="bg-[#010016] min-h-full flex w-full p-5 md:h-full">
      <div className="mx-auto flex flex-col md:flex-row gap-5 w-full">
        <div className="flex justify-center w-full md:w-2/3 h-full">
          <div className="p-5 flex flex-col gap-3 my-auto border-2 border-[#05d7fc] rounded-md hover:text-shadow-[#05d7fc] w-full h-full">
            <h2>Minimum setup:</h2>
            <div className="overflow-auto w-full">
              <pre className="whitespace-pre rounded !bg-[#0b1020] p-3 language-ts">
                <code className="!text-shadow-none">{snippet}</code>
              </pre>
            </div>
          </div>
        </div>
        <div className="flex justify-center w-full md:w-1/3">
          <div className="p-5 flex flex-col gap-3 my-auto border-2 border-[#05d7fc] rounded-md hover:text-shadow-[#05d7fc] w-full">
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
            <p className="overflow-hidden text-ellipsis text-nowrap">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
