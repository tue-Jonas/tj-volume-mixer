// src/Popup.jsx
import React, { useEffect, useState } from "react";
import { Slider, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from "@mui/material";

export default function Popup() {
  const [tabs, setTabs] = useState([]);

  useEffect(() => {
    chrome.tabs.query({}, (allTabs) => {
      const promises = allTabs.map((tab) => {
        return new Promise((resolve) => {
          if (tab.audible) {
            resolve({ tab, hasMedia: true });
          } else {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: () => {
                  const mediaElements = document.querySelectorAll("audio, video");
                  for (const media of mediaElements) {
                    if (
                      (media.currentSrc && media.currentSrc.trim() !== "") ||
                      (media.src && media.src.trim() !== "")
                    ) {
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
        setTabs(mediaTabs);
      });
    });
  }, []);

  const handleVolumeChange = (tabId, newValue) => {
    const volume = newValue / 100;
    chrome.runtime.sendMessage(
      {
        action: "setVolume",
        tabId: tabId,
        volume: volume,
      },
      () => {
        console.log(`Volume updated for tab ${tabId}`);
      }
    );
  };

  if (tabs.length === 0) {
    return <Typography>No tabs are playing audio or have valid media elements.</Typography>;
  }

  return (
    <>
      <List>
        {tabs.map((tab) => (
          <ListItem
            key={tab.id}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              marginBottom: "10px",
              padding: "10px",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Box display="flex" width="100%" alignItems="center">
              <ListItemAvatar>
                <Avatar src={tab.favIconUrl || "default-icon.png"} />
              </ListItemAvatar>
              <ListItemText primary={tab.title || tab.url} />
            </Box>
            <Box width="100%" mt={1}>
              <Slider
                defaultValue={100}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={100}
                onChangeCommitted={(event, value) => handleVolumeChange(tab.id, value)}
              />
            </Box>
          </ListItem>
        ))}
      </List>
    </>
  );
}
