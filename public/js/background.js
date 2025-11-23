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
  } else if (message.action === "getTabId") {
    // Return the tab ID of the sender
    if (sender.tab && sender.tab.id) {
      sendResponse({ tabId: sender.tab.id });
    } else {
      sendResponse({ tabId: null });
    }
  }
  return true; // Keep the message channel open for async response
});
