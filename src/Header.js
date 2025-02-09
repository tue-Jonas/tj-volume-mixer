import React from "react";

function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "15px", margin: "10px" }}>
      <img src="/logo/logo-128.png" alt="TJ" height="50" />
      <h1>Volume Mixer</h1>
    </div>
  );
}

export default Header;
