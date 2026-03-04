import browser from "webextension-polyfill";

async function sendMessageToExt(action: string, body: any = {}) {
  let res = await browser.runtime.sendMessage({ action: action, body: body ?? {} });
  return res;
}

window.sendMessageToExt = sendMessageToExt;
