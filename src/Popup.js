import React, { useEffect, useState } from "react";
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from "@mui/material";
import "./popup.css";
import Header from "./Header";
import VolumeSlider from "./components/VolumeSlider";

export default function Popup() {
  const [tabs, setTabs] = useState([]);
  // volumes holds persisted values (scale 0 to 1)
  const [volumes, setVolumes] = useState({});
  // muteStates holds mute state for each tab
  const [muteStates, setMuteStates] = useState({});

  // Load saved volume settings.
  useEffect(() => {
    chrome.storage.local.get("volumes", (result) => {
      if (result.volumes) {
        setVolumes(result.volumes);
      }
    });
  }, []);

  // Query tabs and check for media; initialize slider values and mute states.
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
        // Initialize muteStates based on current tab muted info.
        const initialMuteStates = {};
        mediaTabs.forEach((tab) => {
          initialMuteStates[tab.id] = tab.mutedInfo ? tab.mutedInfo.muted : false;
        });
        setMuteStates(initialMuteStates);
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

  const handleVolumeCommitChange = (tabId, value) => {
    const volume = value / 100;
    setVolumes((prev) => {
      const newVolumes = { ...prev, [tabId]: volume };
      chrome.storage.local.set({ volumes: newVolumes });
      return newVolumes;
    });
    console.log(`Volume committed for tab ${tabId}`);
  };

  // Toggle mute state for a given tab.
  const handleToggleMute = (tabId) => {
    const currentMute = muteStates[tabId] || false;
    const newMute = !currentMute;
    chrome.tabs.update(tabId, { muted: newMute }, () => {
      setMuteStates((prev) => ({ ...prev, [tabId]: newMute }));
      console.log(`Mute toggled for tab ${tabId}: ${newMute}`);
    });
  };

  const TabList = () => {
    return (
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
            const currentVolume = volumes[tab.id] !== undefined ? volumes[tab.id] * 100 : 100;
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
                      padding: "0px 0px 15px 25px",
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
                    <VolumeSlider
                      tabId={tab.id}
                      initialValue={currentVolume}
                      isMuted={muteStates[tab.id]}
                      onLiveChange={handleVolumeLiveChange}
                      onCommitChange={handleVolumeCommitChange}
                      onToggleMute={handleToggleMute}
                    />
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </div>
    );
  };

  return (
    <>
      <Header />
      {tabs.length === 0 ? (
        <Typography style={{ textAlign: "center" }}>No tab is playing audio.</Typography>
      ) : (
        <TabList />
      )}
      <Box sx={{ p: 1, textAlign: "center", opacity: 0.7 }}>
        <Typography variant="caption">
          v{chrome.runtime.getManifest().version}
        </Typography>
      </Box>
    </>
  );
}
