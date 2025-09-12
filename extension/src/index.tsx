import { render } from "preact";
import Button from "./components/Button";

import "./style.css";

export function App() {
  return (
    <div className="bg-[#010016] h-full flex justify-center">
      <div className="max-w-md p-5 flex flex-col gap-3 my-auto h-1/2 border-2 border-[#05d7fc] rounded-md hover:text-shadow-[#05d7fc]">
        <h1 className="text-xl">Sample Page</h1>
        <h2 className="text-sm">
          This is a sample of how the extension would behave within a website
        </h2>
        <Button id="test" text="Test the button" />
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));
