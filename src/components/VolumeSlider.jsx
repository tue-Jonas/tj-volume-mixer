import React, { useState } from "react";
import { Slider, IconButton } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

const VolumeSlider = React.memo(({ tabId, initialValue, isMuted, onLiveChange, onCommitChange, onToggleMute }) => {
  const [localValue, setLocalValue] = useState(initialValue);

  const handleChange = (event, value) => {
    setLocalValue(value);
    onLiveChange(tabId, value);
  };

  const handleChangeCommitted = (event, value) => {
    onCommitChange(tabId, value);
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Slider
        value={localValue}
        valueLabelDisplay="auto"
        step={1}
        min={0}
        max={100}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        style={{ flex: 1 }}
      />
      <IconButton onClick={() => onToggleMute(tabId)}>{isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}</IconButton>
    </div>
  );
});

export default VolumeSlider;
