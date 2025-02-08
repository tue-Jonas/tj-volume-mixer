document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ audible: true }, (tabs) => {
    const tabList = document.getElementById("tabList");
    tabs.forEach((tab) => {
      const li = document.createElement("li");
      li.className = "tab-item";

      const titleSpan = document.createElement("span");
      titleSpan.textContent = tab.title || tab.url;
      titleSpan.className = "tab-title";

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

      li.appendChild(titleSpan);
      li.appendChild(slider);
      tabList.appendChild(li);
    });
  });
});
