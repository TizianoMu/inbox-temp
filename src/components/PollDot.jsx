export default function PollDot({ polling }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: polling ? "#2ecc71" : "#ccc",
        transition: "background 0.3s",
        flexShrink: 0,
      }}
    />
  );
}
