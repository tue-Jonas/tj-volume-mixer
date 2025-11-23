// Content script that monitors for new media elements and applies saved volume

let currentTabId = null;
let savedVolume = 1.0; // Default volume (scale 0 to 1)

// Get the current tab ID
chrome.runtime.sendMessage({ action: "getTabId" }, (response) => {
  if (response && response.tabId) {
    currentTabId = response.tabId;
    loadVolumeSettings();
  }
});

// Load saved volume settings from storage
function loadVolumeSettings() {
  if (!currentTabId) return;
  
  chrome.storage.local.get("volumes", (result) => {
    if (result.volumes && result.volumes[currentTabId] !== undefined) {
      savedVolume = result.volumes[currentTabId];
      console.log(`[TJ Volume Mixer] Loaded saved volume for tab ${currentTabId}: ${savedVolume}`);
      applyVolumeToAllMedia();
    }
  });
}

// Listen for volume changes from storage
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.volumes) {
    const newVolumes = changes.volumes.newValue;
    if (currentTabId && newVolumes && newVolumes[currentTabId] !== undefined) {
      savedVolume = newVolumes[currentTabId];
      console.log(`[TJ Volume Mixer] Volume updated for tab ${currentTabId}: ${savedVolume}`);
      applyVolumeToAllMedia();
    }
  }
});

// Apply saved volume to all media elements
function applyVolumeToAllMedia() {
  const mediaElements = document.querySelectorAll("audio, video");
  mediaElements.forEach((el) => {
    if (el.volume !== savedVolume) {
      el.volume = savedVolume;
      console.log(`[TJ Volume Mixer] Applied volume ${savedVolume} to media element`);
    }
  });
}

// Monitor for new media elements using MutationObserver
const observer = new MutationObserver((mutations) => {
  let newMediaFound = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // Check if the added node is a media element
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "AUDIO" || node.tagName === "VIDEO") {
          node.volume = savedVolume;
          newMediaFound = true;
          console.log(`[TJ Volume Mixer] New media element detected, applied volume: ${savedVolume}`);
        }
        
        // Check if any descendants are media elements
        const mediaChildren = node.querySelectorAll("audio, video");
        if (mediaChildren.length > 0) {
          mediaChildren.forEach((el) => {
            el.volume = savedVolume;
          });
          newMediaFound = true;
          console.log(`[TJ Volume Mixer] New media elements detected in subtree, applied volume: ${savedVolume}`);
        }
      }
    });
  });
  
  // Also check for media elements that might have been modified
  if (!newMediaFound) {
    applyVolumeToAllMedia();
  }
});

// Start observing the document
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Apply volume to existing media elements on load
applyVolumeToAllMedia();

// Listen for media element events to catch dynamically loaded sources
document.addEventListener("loadedmetadata", (event) => {
  if (event.target && (event.target.tagName === "AUDIO" || event.target.tagName === "VIDEO")) {
    event.target.volume = savedVolume;
    console.log(`[TJ Volume Mixer] Media loadedmetadata event, applied volume: ${savedVolume}`);
  }
}, true);

document.addEventListener("canplay", (event) => {
  if (event.target && (event.target.tagName === "AUDIO" || event.target.tagName === "VIDEO")) {
    event.target.volume = savedVolume;
    console.log(`[TJ Volume Mixer] Media canplay event, applied volume: ${savedVolume}`);
  }
}, true);

console.log("[TJ Volume Mixer] Content script loaded and monitoring for media elements");
