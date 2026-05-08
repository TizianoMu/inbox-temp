export default function PollDot({ polling }) {
  return (
    <span
      className="poll-dot"
      style={{
        background: polling ? "#2ecc71" : "#ccc",
      }}
    />
  );
}
