import React, { useState, useCallback } from "react";
import "../../App.css";
import { IButtonProps } from "./interface";
import PlayIcon from "./icons/play";
import StopIcon from "./icons/stop";
import PauseIcon from "./icons/pause";

export default function AnimationButton({ onClick, text }: IButtonProps) {
  const [animationState, setAnimation] = useState<{
    width?: number;
    height?: number;
    top?: string;
    left?: string;
  }>({});

  const animation = useCallback((event: any) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    setAnimation({
      width: size,
      height: size,
      top: y + "px",
      left: x + "px",
    });

    setTimeout(() => setAnimation({}), 450);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          onClick();
          animation(event);
        }}
        className="buttons"
        style={{
          gridColumn: text === "Play" ? "1" : text === "Pause" ? "2" : "3",
          gridRow: "1",
          justifySelf:
            text === "Play" ? "right" : text === "Pause" ? "center" : "left",
          alignSelf: "center",
        }}
      >
        {text === "Play" ? (
          <PlayIcon />
        ) : text === "Stop" ? (
          <StopIcon />
        ) : (
          <PauseIcon />
        )}
        {animationState.width && (
          <span className="overlay" style={animationState}></span>
        )}
      </button>
    </>
  );
}
