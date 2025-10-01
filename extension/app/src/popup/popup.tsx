import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button, Fader } from "@nbiobsp-native-web-extension/shared";
import "@nbiobsp-native-web-extension/shared/styles";

import "../utils.js";

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
    const [tab] = await chrome.tabs.query({
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
        const has = await chrome.permissions.contains({ origins: [origin] });
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
      message = chrome.i18n.getMessage("popup_captureFail");
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
      if (originAllowed) {
        res = await chrome.permissions.remove({
          permissions: ["scripting"],
          origins: [origin],
        });
      } else {
        res = await chrome.permissions.request({
          permissions: ["scripting"],
          origins: [origin],
        });
      }
      let perms = await chrome.permissions.getAll();
      console.log("Current permissions:", perms);
      if (res) setOriginAllowed(!originAllowed);
    } finally {
      setOriginLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-between p-5 w-64 bg-[#010016]">
      <div className="flex flex-col gap-3">
        <span>
          <h1 className="font-bold text-lg">
            {chrome.i18n.getMessage("extName")}
          </h1>
        </span>
        <p className="text-sm">
          {chrome.i18n.getMessage("popup_desc")}
          <br />
          {chrome.i18n.getMessage("popup_desc2")}
        </p>
        <h2 id="devices-detected" className="inline-flex justify-center">
          {isEnumLoading ? (
            <>
              {chrome.i18n.getMessage("checkingDevices")}
              <Fader id="loader-dots" text=" . . . ." />
            </>
          ) : (
            <>
              {chrome.i18n.getMessage("devicesDetected")}: {deviceCount}
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
            text={`${chrome.i18n.getMessage("capture")}`}
            loading={isCaptureLoading}
            onClick={handleCapture}
          />
        </section>
      </div>
      {hostInstalled && (
        <p className="overflow-hidden text-ellipsis text-nowrap">{message}</p>
      )}
      {!hostInstalled && (
        <a href={installUrl} className="underline text-blue-600">
          {message}
        </a>
      )}

      <p>{chrome.i18n.getMessage("popup_permissionDesc")}</p>
      <Button
        id="add"
        text={
          originAllowed
            ? chrome.i18n.getMessage("popup_revoke")
            : chrome.i18n.getMessage("popup_grant")
        }
        loading={originLoading}
        onClick={toggleOrigin}
      />
      <p>{chrome.i18n.getMessage("popup_permissionDesc2")}</p>
    </div>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
