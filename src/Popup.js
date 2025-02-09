// src/Popup.jsx
import React, { useEffect, useState } from "react";
import { Slider, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from "@mui/material";
import "./popup.css";
import Header from "./Header";

export default function Popup() {
  const [tabs, setTabs] = useState([]);
  // volumes holds persisted values (scale 0 to 1)
  const [volumes, setVolumes] = useState({});
  // sliderValues holds the live slider value (scale 0 to 100)
  const [sliderValues, setSliderValues] = useState({});

  // Load saved volume settings when component mounts.
  useEffect(() => {
    chrome.storage.local.get("volumes", (result) => {
      if (result.volumes) {
        setVolumes(result.volumes);
      }
    });
  }, []);

  // Query tabs and check for media; initialize sliderValues for each tab.
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
                  // Fallback: if URL contains "twitch.tv", assume it has media.
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
        // Initialize sliderValues: if there's a persisted volume, use that (converted to 0-100),
        // otherwise default to 100.
        const initialValues = {};
        mediaTabs.forEach((tab) => {
          initialValues[tab.id] = volumes[tab.id] !== undefined ? volumes[tab.id] * 100 : 100;
        });
        setSliderValues(initialValues);
      });
    });
  }, [volumes]);

  // Live update: send volume change messages immediately.
  const handleVolumeLiveChange = (tabId, value) => {
    const volume = value / 100;
    chrome.runtime.sendMessage(
      {
        action: "setVolume",
        tabId: tabId,
        volume: volume,
      },
      () => {
        console.log(`Live volume update for tab ${tabId}`);
      }
    );
  };

  // Commit change: update state and persist the value.
  const handleVolumeCommitChange = (tabId, value) => {
    const volume = value / 100;
    setVolumes((prev) => {
      const newVolumes = { ...prev, [tabId]: volume };
      chrome.storage.local.set({ volumes: newVolumes });
      return newVolumes;
    });
    console.log(`Volume committed for tab ${tabId}`);
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
          {tabs.map((tab) => {
            // Get the live slider value, defaulting to 100 if not set.
            const currentSliderValue = sliderValues[tab.id] !== undefined ? sliderValues[tab.id] : 100;
            return (
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
                      value={currentSliderValue}
                      valueLabelDisplay="auto"
                      step={1}
                      min={0}
                      max={100}
                      onChange={(event, value) => {
                        // Update live slider state.
                        setSliderValues((prev) => ({ ...prev, [tab.id]: value }));
                        handleVolumeLiveChange(tab.id, value);
                      }}
                      onChangeCommitted={(event, value) => handleVolumeCommitChange(tab.id, value)}
                    />
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </div>
    </>
  );
}
