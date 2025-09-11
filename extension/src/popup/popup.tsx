import { render } from "preact";

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
        <button id="capture" className="button">
          Capture
        </button>
        <button id="enroll" className="button">
          Enroll
        </button>
      </section>
    </div>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
