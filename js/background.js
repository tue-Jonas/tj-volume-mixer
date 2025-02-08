chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setVolume") {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: (vol) => {
        const mediaElements = document.querySelectorAll("audio, video");
        mediaElements.forEach((el) => { el.volume = vol; });
      },
      args: [message.volume]
    });
    sendResponse({status: "Volume set"});
  }
});
