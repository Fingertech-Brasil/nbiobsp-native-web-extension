async function sendMessageToExt(action: string) {
  let res = await chrome.runtime.sendMessage({ action: action });
  return res;
}

window.sendMessageToExt = sendMessageToExt;
