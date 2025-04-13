"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ logoSrc, altText = "Company logo", size = "w-10 h-10" }) {
  return <img src={logoSrc} alt={altText} className={size} />;
}

function StoryComponent() {
  return (
    <div>
      <MainComponent logoSrc="https://cdn-icons-png.flaticon.com/512/5149/5149019.png" />
      <MainComponent 
        logoSrc="https://cdn-icons-png.flaticon.com/512/5149/5149019.png" 
        altText="Alternate company logo" 
        size="w-14 h-14" 
      />
    </div>
  );
});
}