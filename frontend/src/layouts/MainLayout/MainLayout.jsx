import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navigation from "../../components/Navigation/Navigation";
import "./MainLayout.scss";

const MainLayout = () => {
  const location = useLocation();
  const isChatPage =
    location.pathname === "/chat" || location.pathname.startsWith("/chat/");

  return (
    <div className={`main-layout ${isChatPage ? "main-layout--chat" : ""}`}>
      <Navigation />
      <div className="main-layout__container">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
