"use client";
import React from "react";

function MainComponent({
  text,
  keyboardCommand,
  highlighted = false,
  onClick,
}) {
  const baseClasses =
    "inline-block px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 ease-in-out";
  const regularClasses = "border-[#E2E2E1] text-[#191919]";
  const highlightedClasses = "bg-[#6567EF] border-[#6567EF] text-white";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${
        highlighted ? highlightedClasses : regularClasses
      }`}
    >
      {text}
      {keyboardCommand && (
        <span
          className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
            highlighted
              ? "bg-[#7A7CF0] text-white"
              : "bg-[#F6F6F6] text-[#8C8C8C]"
          }`}
        >
          {keyboardCommand}
        </span>
      )}
    </button>
  );
}

function StoryComponent() {
  return (
    <div className="flex flex-col items-start space-y-4 p-4">
      <MainComponent text="Regular Button" />
      <MainComponent text="With Keyboard Command" keyboardCommand="Ctrl+S" />
      <MainComponent text="Highlighted Button" highlighted={true} />
      <MainComponent
        text="Highlighted with Command"
        keyboardCommand="Cmd+P"
        highlighted={true}
      />
    </div>
  );
}

export default Button;