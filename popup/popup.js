document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ audible: true }, (tabs) => {
    const tabList = document.getElementById("tabList");

    // If no audible tabs, show an info message
    if (tabs.length === 0) {
      const infoItem = document.createElement("li");
      infoItem.className = "no-audio";
      infoItem.textContent = "No tabs are playing audio.";
      tabList.appendChild(infoItem);
    }

    // For each audible tab, create a list item with a header and slider
    tabs.forEach((tab) => {
      const li = document.createElement("li");
      li.className = "tab-item";

      // Create a header container for the favicon and title
      const headerDiv = document.createElement("div");
      headerDiv.className = "tab-header";

      // Favicon image (fallback to a default icon if not available)
      const faviconImg = document.createElement("img");
      faviconImg.src = tab.favIconUrl || "default-icon.png"; // Ensure default-icon.png is in your assets
      faviconImg.alt = "Tab Icon";

      // Tab title
      const titleSpan = document.createElement("span");
      titleSpan.textContent = tab.title || tab.url;
      titleSpan.className = "tab-title";

      headerDiv.appendChild(faviconImg);
      headerDiv.appendChild(titleSpan);

      // Volume slider
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

      // Append header and slider to the list item
      li.appendChild(headerDiv);
      li.appendChild(slider);
      tabList.appendChild(li);
    });
  });
});
