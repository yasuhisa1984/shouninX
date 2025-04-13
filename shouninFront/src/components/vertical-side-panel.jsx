"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({
  icons,
  activeIcon,
  avatarSrc,
  logoSrc = "https://cdn-icons-png.flaticon.com/512/5149/5149019.png",
}) {
  return (
    <div className="flex flex-col h-screen w-20 bg-white border-r border-gray-200">
      <div className="flex justify-center py-4">
        <img src={logoSrc} alt="Company logo" className="w-10 h-10" />
      </div>
      <div className="flex-grow flex flex-col items-center space-y-4 py-4">
        {icons.map((icon, index) => (
          <button
            key={index}
            className={`p-2 rounded-md ${
              icon === activeIcon ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
          >
            <i className={`fas ${icon} text-gray-600`}></i>
          </button>
        ))}
      </div>
      <div className="flex justify-center py-4">
        <img
          src={avatarSrc}
          alt="User avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
    </div>
  );
}

function StoryComponent() {
  const icons = ["fa-comment", "fa-user", "fa-bell", "fa-cog"];
  const activeIcon = "fa-comment";
  const avatarSrc = "/path/to/avatar.jpg";

  return (
    <div className="h-screen bg-gray-100">
      <MainComponent
        icons={icons}
        activeIcon={activeIcon}
        avatarSrc={avatarSrc}
      />
    </div>
  );
});
}