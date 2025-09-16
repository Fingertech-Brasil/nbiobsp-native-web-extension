const Fader = ({ id, text }) => {
  return (
    <div id={id} className="relative">
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={`relative inline-flex ${char === " " ? "w-1" : ""}`}
          style={{
            animation: `fadeInOut 2s ${0.1 * index}s ease-in-out infinite`,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

export default Fader;
