import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Import Font Awesome
const head = document.getElementsByTagName("head")[0];
const fontAwesome = document.createElement("link");
fontAwesome.rel = "stylesheet";
fontAwesome.href =
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
head.appendChild(fontAwesome);

// Import Google Fonts
const googleFonts = document.createElement("link");
googleFonts.rel = "stylesheet";
googleFonts.href =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap";
head.appendChild(googleFonts);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
