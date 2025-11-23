// Content script that monitors for new media elements and applies saved volume

let currentTabId = null;
let currentUrl = window.location.origin; // Use origin (protocol + domain) as persistent key
let savedVolume = 1.0; // Default volume (scale 0 to 1)
let isApplyingVolume = false; // Flag to prevent recursive updates

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
  
  // Check both URL-based and tab-based storage for backwards compatibility
  chrome.storage.local.get("volumes", (result) => {
    if (result.volumes) {
      // Prefer URL-based storage for persistence across sessions
      if (result.volumes[currentUrl] !== undefined) {
        savedVolume = result.volumes[currentUrl];
        console.log(`[TJ Volume Mixer] Loaded saved volume for URL ${currentUrl}: ${savedVolume}`);
      } else if (result.volumes[currentTabId] !== undefined) {
        // Fall back to tab-based for current session
        savedVolume = result.volumes[currentTabId];
        console.log(`[TJ Volume Mixer] Loaded saved volume for tab ${currentTabId}: ${savedVolume}`);
      }
      applyVolumeToAllMedia();
    }
  });
}

// Listen for volume changes from storage (from extension UI)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.volumes) {
    const newVolumes = changes.volumes.newValue;
    if (newVolumes) {
      // Check URL-based storage first, then tab-based
      if (newVolumes[currentUrl] !== undefined) {
        savedVolume = newVolumes[currentUrl];
        console.log(`[TJ Volume Mixer] Volume updated for URL ${currentUrl}: ${savedVolume}`);
        applyVolumeToAllMedia();
      } else if (currentTabId && newVolumes[currentTabId] !== undefined) {
        savedVolume = newVolumes[currentTabId];
        console.log(`[TJ Volume Mixer] Volume updated for tab ${currentTabId}: ${savedVolume}`);
        applyVolumeToAllMedia();
      }
    }
  }
});

// Helper function to check if element is a media element
function isMediaElement(element) {
  return element && (element.tagName === "AUDIO" || element.tagName === "VIDEO");
}

// Apply saved volume to a specific media element
function applyVolumeToElement(element) {
  if (element.volume !== savedVolume) {
    isApplyingVolume = true;
    element.volume = savedVolume;
    console.log(`[TJ Volume Mixer] Applied volume ${savedVolume} to media element`);
    // Add event listener for volume changes if not already added
    if (!element.dataset.tjVolumeListenerAttached) {
      element.addEventListener('volumechange', handleVolumeChange);
      element.dataset.tjVolumeListenerAttached = 'true';
    }
    isApplyingVolume = false;
  } else if (!element.dataset.tjVolumeListenerAttached) {
    // Still attach listener even if volume matches
    element.addEventListener('volumechange', handleVolumeChange);
    element.dataset.tjVolumeListenerAttached = 'true';
  }
}

// Handle volume changes from the media element itself (e.g., YouTube's volume slider)
function handleVolumeChange(event) {
  // Ignore if we're the ones applying the volume
  if (isApplyingVolume) return;
  
  const element = event.target;
  if (isMediaElement(element)) {
    const newVolume = element.volume;
    
    // Only update if volume actually changed
    if (Math.abs(newVolume - savedVolume) > 0.01) {
      savedVolume = newVolume;
      console.log(`[TJ Volume Mixer] Detected volume change on media element: ${newVolume}`);
      
      // Save to storage with both URL and tabId
      chrome.storage.local.get("volumes", (result) => {
        const volumes = result.volumes || {};
        volumes[currentUrl] = newVolume; // Persist by URL
        if (currentTabId) {
          volumes[currentTabId] = newVolume; // Also update tab-based for current session
        }
        chrome.storage.local.set({ volumes: volumes });
      });
    }
  }
}

// Apply saved volume to all media elements
function applyVolumeToAllMedia() {
  const mediaElements = document.querySelectorAll("audio, video");
  mediaElements.forEach((el) => {
    applyVolumeToElement(el);
  });
}

// Monitor for new media elements using MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // Check if the added node is a media element
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (isMediaElement(node)) {
          applyVolumeToElement(node);
          console.log(`[TJ Volume Mixer] New media element detected, applied volume: ${savedVolume}`);
        }
        
        // Check if any descendants are media elements
        const mediaChildren = node.querySelectorAll("audio, video");
        if (mediaChildren.length > 0) {
          mediaChildren.forEach((el) => {
            applyVolumeToElement(el);
          });
          console.log(`[TJ Volume Mixer] New media elements detected in subtree, applied volume: ${savedVolume}`);
        }
      }
    });
  });
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
  if (isMediaElement(event.target)) {
    applyVolumeToElement(event.target);
    console.log(`[TJ Volume Mixer] Media loadedmetadata event, applied volume: ${savedVolume}`);
  }
}, true);

document.addEventListener("canplay", (event) => {
  if (isMediaElement(event.target)) {
    applyVolumeToElement(event.target);
    console.log(`[TJ Volume Mixer] Media canplay event, applied volume: ${savedVolume}`);
  }
}, true);

console.log("[TJ Volume Mixer] Content script loaded and monitoring for media elements");
