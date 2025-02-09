document.addEventListener("DOMContentLoaded", () => {
  const tabList = document.getElementById("tabList");

  // Query all tabs instead of only audible ones.
  chrome.tabs.query({}, (tabs) => {
    const promises = tabs.map((tab) => {
      return new Promise((resolve) => {
        // If the tab is already audible, assume it has media.
        if (tab.audible) {
          resolve({ tab, hasMedia: true });
        } else {
          // Inject a content script that checks for audio/video elements with a valid source.
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                const mediaElements = document.querySelectorAll("audio, video");
                for (const media of mediaElements) {
                  // Check if the media element has a non-empty source.
                  if ((media.currentSrc && media.currentSrc.trim() !== "") || (media.src && media.src.trim() !== "")) {
                    return true;
                  }
                }
                return false;
              },
            },
            (results) => {
              if (chrome.runtime.lastError || !results || results.length === 0) {
                resolve({ tab, hasMedia: false });
              } else {
                resolve({ tab, hasMedia: results[0].result });
              }
            }
          );
        }
      });
    });

    Promise.all(promises).then((results) => {
      const mediaTabs = results.filter((item) => item.hasMedia).map((item) => item.tab);

      if (mediaTabs.length === 0) {
        const infoItem = document.createElement("li");
        infoItem.className = "no-audio";
        infoItem.textContent = "No tabs are playing audio or have valid media elements.";
        tabList.appendChild(infoItem);
      } else {
        mediaTabs.forEach((tab) => {
          const li = document.createElement("li");
          li.className = "tab-item";

          // Create header container for favicon and title.
          const headerDiv = document.createElement("div");
          headerDiv.className = "tab-header";

          const faviconImg = document.createElement("img");
          faviconImg.src = tab.favIconUrl || "default-icon.png"; // Ensure default-icon.png is available in your assets.
          faviconImg.alt = "Tab Icon";

          const titleSpan = document.createElement("span");
          titleSpan.textContent = tab.title || tab.url;
          titleSpan.className = "tab-title";

          headerDiv.appendChild(faviconImg);
          headerDiv.appendChild(titleSpan);

          // Create volume slider.
          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = 0;
          slider.max = 1;
          slider.step = 0.01;
          slider.value = 1;
          slider.dataset.tabId = tab.id;

          slider.addEventListener("input", (e) => {
            const newVolume = parseFloat(e.target.value);
            const tabId = parseInt(e.target.dataset.tabId, 10);
            chrome.runtime.sendMessage(
              {
                action: "setVolume",
                tabId: tabId,
                volume: newVolume,
              },
              (response) => {
                console.log(`Volume updated for tab ${tabId}`);
              }
            );
          });

          li.appendChild(headerDiv);
          li.appendChild(slider);
          tabList.appendChild(li);
        });
      }
    });
  });
});
