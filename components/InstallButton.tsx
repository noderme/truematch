"use client";

import { useInstallPrompt } from "../app/hooks/useInstallPrompt";

export function InstallButton() {
  const { installPrompt, install, isInstalled } = useInstallPrompt();

  if (!installPrompt || isInstalled) {
    return null;
  }

  return (
    <button
      onClick={install}
      style={{
        padding: "10px 20px",
        backgroundColor: "#000000",
        color: "#ffffff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Install App
    </button>
  );
}
