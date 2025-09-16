const Button = ({ id, text, loading = false, onClick = () => {} }) => {
  return (
    <button id={id} className="button" disabled={loading} onClick={onClick}>
      {loading ? (
        <div className="loader"></div>
      ) : (
        <span>
          <p>{text}</p>
          <p>{text}</p>
        </span>
      )}
    </button>
  );
};

export default Button;
