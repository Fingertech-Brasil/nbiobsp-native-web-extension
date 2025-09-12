import { render } from "preact";
import Button from "../components/Button";

import "../style.css";

export function App() {
  return (
    <div className="flex flex-col gap-3 justify-between p-5 w-64 bg-[#010016]">
      <div className="flex flex-col gap-3">
        <span>
          <h1 className="font-bold text-lg">Device Test</h1>
          <h2 id="devices-detected">Devices Detected: ...</h2>
        </span>
        <p className="text-sm">
          Click the buttons to test the extension functionalities
        </p>
      </div>
      <section className="flex flex-col gap-3 h-full justify-center">
        <Button id="capture" text="Capture" />
        <Button id="enroll" text="Enroll" />
      </section>
    </div>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
