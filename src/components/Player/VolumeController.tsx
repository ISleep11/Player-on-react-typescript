import { useCallback, useState } from "react";
import Volume1Icon from "./icons/volume-1";
import Volume2Icon from "./icons/volume-2";
import VolumeXIcon from "./icons/volume-x";
import { debounce } from "lodash";

export default function VolumeController({ soundController }: any) {
  const [volumeValue, setVolumeValue] = useState(100);

  const onVolumeChange = useCallback(
    debounce((event: any) => {
      const rawValue = Number(event.target.value);
      const adjustedValue = Math.trunc((rawValue + 1) * 50);
      setVolumeValue(adjustedValue);
      soundController.current?.changeVolume(rawValue);
    }, 50), // 50 мс задержка
    [soundController]
  );

  return (
    <div className="volume-controller-container">
      {volumeValue < 40 && volumeValue !== 0 && <Volume1Icon />}
      {volumeValue >= 40 && <Volume2Icon />}
      {volumeValue === 0 && <VolumeXIcon />}
      <input
        type="range"
        onChange={onVolumeChange}
        defaultValue={1}
        min={-1}
        max={1}
        step={0.01}
        className="volume-controller"
      />
      <div className="slide-value">{volumeValue}</div>
    </div>
  );
}
