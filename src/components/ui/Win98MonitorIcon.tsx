

export function Win98MonitorIcon({
  width = 180,
}: {
  width?: number;
}) {
  return (
    <img
      src="/img/win98-monitor.png"
      width={width}
      alt=""
      draggable={false}
      style={{
        display: "block",
        imageRendering: "pixelated", // key: makes scaling look retro
        height: "auto", // maintain aspect ratio
      }}
    />
  );
}
