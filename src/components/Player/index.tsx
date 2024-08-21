import React, { useCallback, useState, useRef } from "react";
import SoundDriver from "./SoundDriver";
import ArrowIcon from "./icons/arrow";
import AnimationButton from "./Buttons";
import "../../App.css";
import UploadIcon from "./icons/upload";

function Player() {
  const soundController = useRef<undefined | SoundDriver>(undefined);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);

  const uploadAudio = useCallback(async (event: any) => {
    const { files } = event.target; // files list

    setShowInput(false);

    if (!files.length) {
      // check if the file is selected
      setShowInput(true);
      return;
    }

    setLoading(true);

    const audioFile = files[0]; // input file out of array

    if (!audioFile || !audioFile.type.includes("audio")) {
      // type check
      throw new Error("Wrong audio file");
    }

    const soundInstance = new SoundDriver(audioFile);
    try {
      await soundInstance.init(document.getElementById("waveContainer")); // initialize soundInstance + pass the wave container
      soundController.current = soundInstance; // save soundInstance in useRef
    } catch (err: unknown) {
      console.log(err);
    } finally {
      setLoading(false);
      soundInstance.drawChart(); // draw the sound wave
    }
  }, []);

  const togglePlayer = useCallback(
    (type: string) => () => {
      if (type === "Play") {
        soundController.current?.play(); // play the song
      } else if (type === "Stop") {
        soundController.current?.pause(true); // pause with reset
      } else {
        soundController.current?.pause(); // pause without reset
      }
    },
    []
  );

  const onVolumeChange = useCallback(
    (event: any) => {
      soundController.current?.changeVolume(Number(event.target.value));
    },
    [soundController]
  );

  const onDrop = useCallback((e: any) => {
    e.preventDefault();
    const { files } = e.dataTransfer; // Используйте dataTransfer, а не event.target

    if (!files || !files.length) {
      return; // Проверка наличия файлов
    }

    uploadAudio({ target: { files } }); // Обращение к uploadAudio с файлом
  }, []);
  return (
    <div
      className="main-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {showInput && ( // if audio is not chosen yet => show the "choose" button
        <>
          <input
            type="file"
            name="sound"
            onChange={uploadAudio}
            accept="audio/*" // any audio format
            id="uploadBtn"
          />
          <label htmlFor="uploadBtn" id="upload-label">
            <UploadIcon />
            Upload File
          </label>
        </>
      )}
      {loading && <p id="loading">Loading...</p>}

      <div id="waveContainer">{showInput && <ArrowIcon />}</div>
      {/* Future sound wave */}
      {!loading &&
        soundController.current && ( // if not loading and the soundController already exists
          <div id="controllPanel">
            {["Play", "Pause", "Stop"].map((type, index) => {
              return (
                <AnimationButton
                  onClick={togglePlayer(type)}
                  text={type}
                  key={index}
                />
              );
            })}{" "}
            <input
              type="range"
              onChange={onVolumeChange}
              defaultValue={1}
              min={-1}
              max={1}
              step={0.01}
              className="volume-controller"
            />
          </div>
        )}
    </div>
  );
}

export default Player;
