document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ audible: true }, (tabs) => {
    const tabList = document.getElementById("tabList");
    tabs.forEach((tab) => {
      // Create container for each tab
      const li = document.createElement("li");
      li.className = "tab-item";

      // Create a header for the tab that holds the favicon and title
      const headerDiv = document.createElement("div");
      headerDiv.className = "tab-header";

      // Create favicon image element; use a fallback if not available
      const faviconImg = document.createElement("img");
      faviconImg.src = tab.favIconUrl || "default-icon.png"; // Provide default-icon.png in your extension assets
      faviconImg.alt = "Tab Icon";

      // Create title element
      const titleSpan = document.createElement("span");
      titleSpan.textContent = tab.title || tab.url;
      titleSpan.className = "tab-title";

      headerDiv.appendChild(faviconImg);
      headerDiv.appendChild(titleSpan);

      // Create volume slider element
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = 0;
      slider.max = 1;
      slider.step = 0.01;
      slider.value = 1;
      slider.dataset.tabId = tab.id;

      // Listen for slider changes to send volume update message
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

      // Append header and slider to the tab container
      li.appendChild(headerDiv);
      li.appendChild(slider);
      tabList.appendChild(li);
    });
  });
});
