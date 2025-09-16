import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import Button from "../components/Button";
import Fader from "../components/Fader/index.js";

import "../style.css";
import "../utils.js";

export function App() {
  const [isCaptureLoading, setCaptureLoading] = useState(true);
  const [isEnrollLoading, setEnrollLoading] = useState(true);
  const [isCheckingDevices, setIsCheckingDevices] = useState(true);
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
        setIsCheckingDevices(false);
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
          <h1 className="font-bold text-lg">Device Test</h1>
        </span>
        <p className="text-sm">
          Click the buttons to test the extension functionalities
          <br />
          (the extension uses the first detected device by default)
        </p>
        <h2 id="devices-detected" className="inline-flex justify-center">
          {isCheckingDevices ? (
            <>
              Checking for devices
              <Fader id="loader-dots" text=" . . . ." />
            </>
          ) : (
            <>Devices Detected: {deviceCount}</>
          )}
        </h2>
      </div>
      <section
        id="buttons"
        className="flex flex-col gap-3 h-full justify-center"
      >
        <Button
          id="capture"
          text="Capture"
          loading={isCaptureLoading}
          onClick={handleCapture}
        />
        <Button
          id="enroll"
          text="Enroll"
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
