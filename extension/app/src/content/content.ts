// Listen for postMessage from page
window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.origin !== window.location.origin ||
    event.data?.type !== "fromPage"
  ) {
    return;
  }

  chrome.runtime.sendMessage(
    {
      action: event.data.message.action,
      body: event.data.message.body || {},
    },
    (response) => {
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
});
