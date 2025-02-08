document.addEventListener('DOMContentLoaded', () => {
  // Query all open tabs
  chrome.tabs.query({}, (tabs) => {
    const tabList = document.getElementById('tabList');
    tabs.forEach((tab) => {
      // Create a list item for each tab
      const li = document.createElement('li');
      li.className = 'tab-item';

      // Create an element to display the tab's title (or URL if title not available)
      const titleSpan = document.createElement('span');
      titleSpan.textContent = tab.title || tab.url;
      titleSpan.className = 'tab-title';

      // Create a volume slider input
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 1;
      slider.step = 0.01;
      slider.value = 1; // Default volume: 100%
      slider.dataset.tabId = tab.id; // Save the tab id in a data attribute

      // Listen for slider changes
      slider.addEventListener('input', (e) => {
        const newVolume = parseFloat(e.target.value);
        const tabId = parseInt(e.target.dataset.tabId, 10);
        // Send message to background script to set volume for this tab
        chrome.runtime.sendMessage({
          action: 'setVolume',
          tabId: tabId,
          volume: newVolume
        }, (response) => {
          console.log(`Volume updated for tab ${tabId}`);
        });
      });

      // Append the title and slider to the list item, then add it to the list
      li.appendChild(titleSpan);
      li.appendChild(slider);
      tabList.appendChild(li);
    });
  });
});
