import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import Button from "../components/Button";
import Fader from "../components/Fader/index.js";
import "../i18n";
import { useTranslation } from "preact-i18next";

import "../style.css";
import "../utils.js";

export function App() {
  const { t, i18n } = useTranslation();

  const [isCaptureLoading, setCaptureLoading] = useState(true);
  const [isEnrollLoading, setEnrollLoading] = useState(true);
  const [isEnumLoading, setisEnumLoading] = useState(true);
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    // Function to enumerate devices
    const checkDevices = async () => {
      try {
        let res = await window.sendMessageToExt("enum");
        if (res.status === "success") {
          setDeviceCount(res.data["device-count"]);
          setCaptureLoading(false);
          setEnrollLoading(false);
        }
      } catch (error) {
        console.error("Error checking devices:", error);
        setDeviceCount(-1); // Or handle the error appropriately
      } finally {
        setisEnumLoading(false);
      }
    };

    checkDevices();
  }, []); // The empty array [] ensures this effect runs only once

  const handleCapture = async () => {
    setCaptureLoading(true);
    try {
      await window.sendMessageToExt("capture");
      // Handle success response if needed
    } catch (error) {
      console.error("Capture failed:", error);
    } finally {
      setCaptureLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrollLoading(true);
    try {
      await window.sendMessageToExt("enroll");
      // Handle success response if needed
    } catch (error) {
      console.error("Enroll failed:", error);
    } finally {
      setEnrollLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-between p-5 w-64 bg-[#010016]">
      <div className="flex flex-col gap-3">
        <span>
          <h1 className="font-bold text-lg">{t("popup:title")}</h1>
        </span>
        <p className="text-sm">
          {t("popup:desc")}
          <br />
          {t("popup:desc2")}
        </p>
        <h2 id="devices-detected" className="inline-flex justify-center">
          {isEnumLoading ? (
            <>
              {t("popup:checkingDevices")}
              <Fader id="loader-dots" text=" . . . ." />
            </>
          ) : (
            <>
              {t("popup:devicesDetected")}: {deviceCount}
            </>
          )}
        </h2>
      </div>
      <section
        id="buttons"
        className="flex flex-col gap-3 h-full justify-center"
      >
        <Button
          id="capture"
          text={`${t("capture")}`}
          loading={isCaptureLoading}
          onClick={handleCapture}
        />
        <Button
          id="enroll"
          text={`${t("enroll")}`}
          loading={isEnrollLoading}
          onClick={handleEnroll}
        />
      </section>
    </div>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
