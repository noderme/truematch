export function registerPWA(): void {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("PWA Service Worker registered:", registration);

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
      } catch (error) {
        console.error("PWA Service Worker registration failed:", error);
      }
    });
  }
}

export function listenForPWAUpdates(): void {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("New Service Worker activated");
      // Optionally show a notification to the user
      showUpdateNotification();
    });
  }
}

function showUpdateNotification(): void {
  // You can customize this notification
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("App Updated", {
        body: "A new version of the app is available!",
      });
    }
  }
}
