"use client";

import { useInstallPrompt } from "../app/hooks/useInstallPrompt";

export function InstallButton() {
  const { installPrompt, install, isInstalled } = useInstallPrompt();

  if (!installPrompt || isInstalled) return null;

  return (
    <button
      onClick={install}
      className="px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-300 text-xs font-medium hover:bg-slate-700 hover:text-slate-100 transition-all duration-200"
    >
      Install App
    </button>
  );
}
