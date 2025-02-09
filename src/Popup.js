// src/Popup.jsx
import React, { useEffect, useState } from "react";
import { Slider, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from "@mui/material";
import "./popup.css";
import Header from "./Header";

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
                  let hasMedia = results[0].result;
                  // Fallback: if no media is detected but the URL is known (e.g., Twitch), assume it has media.
                  if (!hasMedia && tab.url && tab.url.includes("twitch.tv")) {
                    hasMedia = true;
                  }
                  resolve({ tab, hasMedia });
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
    return <Typography>No tab is playing audio.</Typography>;
  }

  return (
    <>
      <Header />
      <div className="list-container">
        <List
          disablePadding
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {tabs.map((tab) => (
            <ListItem
              key={tab.id}
              className="list-item"
              disablePadding
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Box display="flex" width="100%" alignItems="center">
                <ListItemAvatar style={{ minWidth: 35 }}>
                  <Avatar
                    sx={{ width: 35, height: 35, margin: "0 0 22px 10px" }}
                    variant="square"
                    src={tab.favIconUrl || "default-icon.png"}
                  />
                </ListItemAvatar>
                <Box
                  width="100%"
                  sx={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    padding: "0px 25px 15px 25px",
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{
                      style: {
                        fontSize: "0.9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      },
                    }}
                    primary={tab.title || tab.url}
                  />
                  <Slider
                    defaultValue={100}
                    valueLabelDisplay="auto"
                    step={1}
                    min={0}
                    max={100}
                    onChange={(event, value) => handleVolumeChange(tab.id, value)}
                  />
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </div>
    </>
  );
}
