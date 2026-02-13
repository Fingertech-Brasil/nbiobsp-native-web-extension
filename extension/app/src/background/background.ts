import browser from "webextension-polyfill";

const extensionId = "com.nbiobsp_native_web_ext";
const scripting = (browser as any).scripting;

let busy: Object = {};

async function sendNativeMessage(action: string, body: any) {
  let jsonMessage = {
    action: action,
    body: body || {},
  };

  if (busy[action]) {
    throw new Error(browser.i18n.getMessage("background_busy"));
  }
  busy[action] = true;
  try {
    const res: any = await browser.runtime.sendNativeMessage(
      extensionId,
      jsonMessage
    );
    return res?.data;
  } finally {
    busy[action] = false;
  }
}

function callBacker(
  message: any,
  sender: browser.Runtime.MessageSender,
  sendResponse: Function
): true {
  (async () => {
    try {
      if (message.action) {
        let data = await sendNativeMessage(message.action, message.body ?? {});
        if (!data) {
          throw new Error(browser.i18n.getMessage("background_noDataReceived"));
        }
        console.log("Data from native app:", data);
        sendResponse({
          status: "success",
          message: browser.i18n.getMessage("background_operationSuccessful"),
          data: data,
        });
      } else {
        console.log("No valid action found in the message: ", message);
        sendResponse({
          status: "error",
          message: browser.i18n.getMessage("background_invalidAction"),
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error in background script:", err);
      if (err?.message?.includes("host")) {
        let url =
          "https://fingertech.com.br/download/Nitgen/Hamster/Windows/NBioBSP Extension Setup.zip";
        if (sender.tab?.id) {
          await executeScriptCompat(sender.tab!.id!, alertActiveTab, [
            browser.i18n.getMessage("background_installPrompt"),
            url,
          ]);
        } else {
          sendResponse({
            status: "error",
            message: browser.i18n.getMessage("background_installPrompt"),
            url: url,
          });
        }
      }
      sendResponse({
        status: "error",
        message: browser.i18n.getMessage("background_operationFailed"),
      });
    }
  })();
  return true;
}

browser.runtime.onMessage.addListener(callBacker);

function alertActiveTab(text: string, url: string) {
  const box = document.createElement("div");
  box.style.cssText = [
    "position: absolute",
    "left: calc(50vw - 200px)",
    "top: 16px",
    "z-index: 999999",
    "background: #111",
    "padding: 12px 14px",
    "text-align: center",
    "border-radius: 8px",
    "box-shadow: 0 6px 20px rgba(0,0,0,.35)",
    "width: 400px",
  ].join(";");
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = text;
  link.style.cssText =
    "color:#05d7fc;text-decoration:underline;word-break:break-word";
  const close = document.createElement("button");
  close.textContent = "×";
  close.style.cssText =
    "margin-left:8px;background:transparent;border:0;color:#aaa;cursor:pointer;font-size:16px";
  close.onclick = () => box.remove();
  box.append(" ", link, " ", close);
  document.documentElement.appendChild(box);
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.active) return;
  // Ensure scripting permission if it's optional in manifest

  const origin = tab.url ? [tab.url] : [];
  const has = await browser.permissions.contains(
    scripting
      ? { permissions: ["scripting"], origins: origin }
      : { origins: origin }
  );
  if (!has) {
    console.log("no perms for this site: ", tab.url);
    let perms = await browser.permissions.getAll();
    console.log("perms:", perms);
    return;
  }

  await injectBridge(tabId);
});

async function injectBridge(tabId: number) {
  await executeScriptCompat(tabId, () => {
    console.log("Injecting bridge script...");
    const runtime =
      typeof browser !== "undefined" ? browser.runtime : chrome.runtime;
    (window as any).messageHandler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "fromPage"
      ) {
        return;
      }

      if (typeof browser !== "undefined") {
        (runtime as any)
          .sendMessage({
            action: event.data.message.action,
            body: event.data.message.body || {},
          })
          .then((response: any) => {
            console.log("Response from content:", response);
            window.postMessage(
              {
                type: "fromExtension",
                body: response,
                action: event.data.message.action,
              },
              window.location.origin
            );
          })
          .catch((err: Error) => {
            console.error("Message error:", err);
          });
      } else {
        (runtime as any).sendMessage(
          {
            action: event.data.message.action,
            body: event.data.message.body || {},
          },
          (response: any) => {
            console.log("Response from content:", response);
            window.postMessage(
              {
                type: "fromExtension",
                body: response,
                action: event.data.message.action,
              },
              window.location.origin
            );
          }
        );
      }
    };
    window.addEventListener("message", (window as any).messageHandler);
  });
}

browser.permissions.onAdded.addListener(async ({ origins, permissions }) => {
  console.log("Permissions added:", { origins, permissions });
  if (!origins?.length) return;

  // Reload active tab if its origin was revoked
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (!tab?.id || !tab.url) return;

  const originPattern = new URL(tab.url).origin + "/*";
  if (origins.includes(originPattern)) {
    try {
      await browser.tabs.reload(tab.id, { bypassCache: false });
    } catch (e) {
      console.warn("Failed to reload tab:", e);
    }
  }
});

browser.permissions.onRemoved.addListener(async ({ origins, permissions }) => {
  console.log("Permissions removed:", { origins, permissions });
  if (!origins?.length) return;

  // Reload active tab if its origin was revoked
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (!tab?.id || !tab.url) return;

  const originPattern = new URL(tab.url).origin + "/*";
  if (origins.includes(originPattern)) {
    try {
      await browser.tabs.reload(tab.id, { bypassCache: false });
    } catch (e) {
      console.warn("Failed to reload tab:", e);
    }
  }
});

async function executeScriptCompat(
  tabId: number,
  func: (...args: any[]) => void,
  args: any[] = []
) {
  if (scripting?.executeScript) {
    return scripting.executeScript({
      target: { tabId },
      func,
      args,
    });
  }

  const serializedArgs = args.map((arg) => JSON.stringify(arg)).join(",");
  const code = `(${func.toString()})(${serializedArgs});`;
  return browser.tabs.executeScript(tabId, { code });
}
