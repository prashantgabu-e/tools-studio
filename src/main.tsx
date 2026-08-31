import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

if ("serviceWorker" in navigator) {
  const isLocalDevelopment =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  window.addEventListener("load", () => {
    if (isLocalDevelopment) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }

    void navigator.serviceWorker.register("./sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
