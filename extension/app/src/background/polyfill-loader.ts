// Firefox MV2 compatibility wrapper - loads polyfill as global
import browser from "webextension-polyfill";

declare global {
  interface Window {
	browser: typeof browser;
  }
}

window.browser = browser;
globalThis.browser = browser;
