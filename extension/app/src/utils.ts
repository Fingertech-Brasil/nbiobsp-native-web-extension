import browser from "webextension-polyfill";

async function sendMessageToExt(action: string) {
  let res = await browser.runtime.sendMessage({ action: action });
  return res;
}

window.sendMessageToExt = sendMessageToExt;
