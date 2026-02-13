import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button, Fader } from "@nbiobsp-native-web-extension/shared";
import "@nbiobsp-native-web-extension/shared/styles";
import browser from "webextension-polyfill";

import "../utils.js";

declare global {
  interface Window {
    sendMessageToExt(message: string): Promise<any>;
  }
}

export function App() {
  const [isCaptureLoading, setCaptureLoading] = useState(true);
  const [isEnumLoading, setisEnumLoading] = useState(true);
  const [hostInstalled, setHostInstalled] = useState(true);
  const [deviceCount, setDeviceCount] = useState(0);
  const [installUrl, setinstallUrl] = useState("");
  const [message, setMessage] = useState("");

  const [originAllowed, setOriginAllowed] = useState(false);
  const [originLoading, setOriginLoading] = useState(true);

  async function getActiveOrigin(): Promise<string | undefined> {
    const [tab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    const url = tab?.url;
    if (!url) return;
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return; // skip chrome://, file://, etc.
    return `${u.origin}/*`;
  }

  useEffect(() => {
    // Function to enumerate devices
    const checkDevices = async () => {
      try {
        let res = await window.sendMessageToExt("enum");
        if (res.status !== "success") {
          console.log("Enumeration failed:", res.message);
          setDeviceCount(-1);
          setHostInstalled(false);
          setMessage(res.message);
          setinstallUrl(res.url || "");
        } else if (
          res.data["device-count"] !== undefined &&
          res.data["device-count"] > 0
        ) {
          setDeviceCount(res.data["device-count"]);
          setCaptureLoading(false);
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

  useEffect(() => {
    (async () => {
      setOriginLoading(true);
      try {
        const origin = await getActiveOrigin();
        if (!origin) return setOriginAllowed(false);
        const has = await browser.permissions.contains({ origins: [origin] });
        setOriginAllowed(has);
      } finally {
        setOriginLoading(false);
      }
    })();
  }, []);

  const handleCapture = async () => {
    setCaptureLoading(true);
    let res: any;
    let message = "";
    try {
      res = await window.sendMessageToExt("capture");
      if (res.status !== "success") throw new Error(res.message);
      message = "Template: " + res.data.template;
    } catch (error) {
      console.error("Capture failed:", error);
      message = browser.i18n.getMessage("popup_captureFail");
    } finally {
      setCaptureLoading(false);
      setMessage(message);
    }
  };

  const toggleOrigin = async () => {
    let res: boolean;
    setOriginLoading(true);
    try {
      const origin = await getActiveOrigin();
      if (!origin) return;
      const scriptingAvailable = Boolean((browser as any).scripting);
      if (originAllowed) {
        res = await browser.permissions.remove(
          scriptingAvailable
            ? { permissions: ["scripting"], origins: [origin] }
            : { origins: [origin] }
        );
      } else {
        res = await browser.permissions.request(
          scriptingAvailable
            ? { permissions: ["scripting"], origins: [origin] }
            : { origins: [origin] }
        );
      }
      let perms = await browser.permissions.getAll();
      console.log("Current permissions:", perms);
      if (res) setOriginAllowed(!originAllowed);
    } finally {
      setOriginLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-between p-5 w-64 bg-[#010016]">
      <div>
        <h1 className="font-bold text-lg">
          {browser.i18n.getMessage("extName")}
        </h1>
      </div>

      <div className="flex flex-col gap-3 justify-between">
        <p className="text-sm">
          {browser.i18n.getMessage("popup_permissionDesc")}
        </p>
        <Button
          id="add"
          text={
            originAllowed
              ? browser.i18n.getMessage("popup_revoke")
              : browser.i18n.getMessage("popup_grant")
          }
          loading={originLoading}
          onClick={toggleOrigin}
        />
        <p className="text-sm">
          {browser.i18n.getMessage("popup_permissionDesc2")}
        </p>
      </div>

      <hr />

      <div className="flex flex-col gap-3">
        <p className="text-sm">
          {browser.i18n.getMessage("popup_desc")}
          <br />
          {browser.i18n.getMessage("popup_desc2")}
        </p>
        <h2 id="devices-detected" className="inline-flex justify-center">
          {isEnumLoading ? (
            <>
              {browser.i18n.getMessage("checkingDevices")}
              <Fader id="loader-dots" text=" . . . ." />
            </>
          ) : (
            <>
              {browser.i18n.getMessage("devicesDetected")}: {deviceCount}
            </>
          )}
        </h2>
      </div>
      <div>
        <section
          id="buttons"
          className="flex flex-col gap-3 h-full justify-center"
        >
          <Button
            id="capture"
            text={`${browser.i18n.getMessage("capture")}`}
            loading={isCaptureLoading}
            onClick={handleCapture}
          />
        </section>
      </div>
      {hostInstalled && (
        <p className="overflow-hidden text-ellipsis text-nowrap">{message}</p>
      )}
      {!hostInstalled && (
        <a href={installUrl} className="underline text-[#05d7fc]">
          {message}
        </a>
      )}
    </div>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
