const Button = ({ id, text }) => {
  return (
    <button id={id} className="button">
      <span>
        <p>{text}</p>
        <p>{text}</p>
      </span>
    </button>
  );
};

export default Button;
