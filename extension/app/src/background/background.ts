import browser from "webextension-polyfill";
import { NativeMode, nativeClient } from "./native-client";

const scripting = (browser as any).scripting;
const injectedTabs = new Set<number>();

const busy: Record<string, boolean> = {};

async function sendNativeMessage(action: string, body: any) {
  if (busy[action]) {
    throw new Error(browser.i18n.getMessage("background_busy"));
  }

  busy[action] = true;
  try {
    return await nativeClient.request(action, body ?? {});
  } finally {
    busy[action] = false;
  }
}

function isSetModeAction(action: string) {
  return (
    action === "setNativeMode" ||
    action === "set_native_mode" ||
    action === "native_mode_set"
  );
}

function isGetModeAction(action: string) {
  return (
    action === "getNativeMode" ||
    action === "get_native_mode" ||
    action === "native_mode_get"
  );
}

function normalizeMode(body: any): NativeMode {
  const mode = body?.mode;
  if (mode === "persistent" || body?.persistent === true) return "persistent";
  if (mode === "oneshot" || body?.persistent === false) return "oneshot";
  throw new Error("Invalid native mode");
}

function callBacker(
  message: any,
  sender: browser.Runtime.MessageSender,
  sendResponse: Function
): true {
  (async () => {
    try {
      if (message.action) {
        if (isSetModeAction(message.action)) {
          const mode = normalizeMode(message.body ?? {});
          const activeMode = await nativeClient.setMode(mode);
          sendResponse({
            status: "success",
            message: browser.i18n.getMessage("background_operationSuccessful"),
            data: { mode: activeMode },
          });
          return;
        }

        if (isGetModeAction(message.action)) {
          sendResponse({
            status: "success",
            message: browser.i18n.getMessage("background_operationSuccessful"),
            data: { mode: nativeClient.getMode() },
          });
          return;
        }

        let data = await sendNativeMessage(message.action, message.body ?? {});
        console.log("Data from native app:", data);
        sendResponse({
          status: "success",
          message: browser.i18n.getMessage("background_operationSuccessful"),
          data: data ?? {},
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
          sendResponse({
            status: "error",
            message: browser.i18n.getMessage("background_installPrompt"),
            url: url,
          });
          return;
        } else {
          sendResponse({
            status: "error",
            message: browser.i18n.getMessage("background_installPrompt"),
            url: url,
          });
          return;
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

if ((browser.runtime as any).onSuspend?.addListener) {
  (browser.runtime as any).onSuspend.addListener(() => {
    nativeClient.shutdown().catch((error: Error) => {
      console.warn("Failed to shutdown native client cleanly:", error);
    });
  });
}

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
  if (changeInfo.status === "loading") {
    injectedTabs.delete(tabId);
    return;
  }

  if (changeInfo.status !== "complete" || !tab.active) return;
  // Ensure scripting permission if it's optional in manifest

  if (!tab.url) return;
  let originPattern: string | null = null;
  try {
    const url = new URL(tab.url);
    if (!/^https?:$/.test(url.protocol)) return;
    originPattern = `${url.origin}/*`;
  } catch {
    return;
  }

  const has = await browser.permissions.contains(
    scripting
      ? { permissions: ["scripting"], origins: [originPattern] }
      : { origins: [originPattern] }
  );
  if (!has) {
    console.log("no perms for this site: ", tab.url);
    let perms = await browser.permissions.getAll();
    console.log("perms:", perms);
    return;
  }

  if (injectedTabs.has(tabId)) return;

  await injectBridge(tabId);
  injectedTabs.add(tabId);
});

browser.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

async function injectBridge(tabId: number) {
  await executeScriptCompat(tabId, () => {
    console.log("Injecting bridge script...");
    const runtime =
      typeof browser !== "undefined" ? browser.runtime : chrome.runtime;
    const anyWindow = window as any;
    if (anyWindow.messageHandler) {
      window.removeEventListener("message", anyWindow.messageHandler);
    }

    anyWindow.messageHandler = (event: MessageEvent) => {
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
    window.addEventListener("message", anyWindow.messageHandler);
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
