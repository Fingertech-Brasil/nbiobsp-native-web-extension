import browser from "webextension-polyfill";

const extensionId = "com.nbiobsp_native_web_ext";

export type NativeMode = "oneshot" | "persistent";

type NativeEnvelope = {
  id?: number;
  action: string;
  body?: any;
};

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

class OneShotNativeClient {
  async request(action: string, body: any) {
    const response: any = await browser.runtime.sendNativeMessage(extensionId, {
      action,
      body: body ?? {},
    });

    if (response?.error) {
      throw new Error(response?.message || `Native error: ${response.error}`);
    }

    return response?.data;
  }
}

class PersistentNativeClient {
  private port: browser.Runtime.Port | null = null;
  private requestId = 0;
  private pending = new Map<number, PendingRequest>();

  private onMessage = (response: any) => {
    const id = response?.id;
    if (typeof id !== "number") return;

    const pendingRequest = this.pending.get(id);
    if (!pendingRequest) return;

    this.pending.delete(id);

    if (response?.error) {
      pendingRequest.reject(
        new Error(response?.message || `Native error: ${response.error}`)
      );
      return;
    }

    pendingRequest.resolve(response?.data);
  };

  private onDisconnect = () => {
    const runtimeError = browser.runtime.lastError;
    const message = runtimeError?.message || "Native host disconnected";

    for (const [, pendingRequest] of this.pending) {
      pendingRequest.reject(new Error(message));
    }
    this.pending.clear();

    if (this.port) {
      this.port.onMessage.removeListener(this.onMessage);
      this.port.onDisconnect.removeListener(this.onDisconnect);
    }
    this.port = null;
  };

  private ensureConnected() {
    if (this.port) return;

    this.port = browser.runtime.connectNative(extensionId);
    this.port.onMessage.addListener(this.onMessage);
    this.port.onDisconnect.addListener(this.onDisconnect);
  }

  request(action: string, body: any): Promise<any> {
    this.ensureConnected();

    const id = ++this.requestId;
    const payload: NativeEnvelope = {
      id,
      action,
      body: body ?? {},
    };

    return new Promise<any>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      try {
        this.port!.postMessage(payload);
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  disconnect() {
    if (!this.port) return;

    this.port.disconnect();
    this.onDisconnect();
  }
}

class NativeClientManager {
  private mode: NativeMode = "oneshot";
  private readonly oneShot = new OneShotNativeClient();
  private readonly persistent = new PersistentNativeClient();

  getMode(): NativeMode {
    return this.mode;
  }

  async setMode(mode: NativeMode) {
    if (mode === this.mode) return this.mode;

    if (mode === "persistent") {
      await this.persistent.request("session_start", {});
      this.mode = "persistent";
      return this.mode;
    }

    if (this.mode === "persistent") {
      try {
        await this.persistent.request("session_end", {});
      } finally {
        this.persistent.disconnect();
      }
    }

    this.mode = "oneshot";
    return this.mode;
  }

  async request(action: string, body: any) {
    if (this.mode === "persistent") {
      return this.persistent.request(action, body);
    }

    return this.oneShot.request(action, body);
  }

  async shutdown() {
    if (this.mode === "persistent") {
      await this.setMode("oneshot");
    }
  }
}

export const nativeClient = new NativeClientManager();
