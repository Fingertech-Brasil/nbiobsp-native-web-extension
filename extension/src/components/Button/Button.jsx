const Button = ({ id, text, loading = false, onClick = () => {} }) => {
  return (
    <button id={id} className="button" disabled={loading} onClick={onClick}>
      {loading ? (
        <span className="loading">
          <div className="loader"></div>
          <p>{text}</p>
        </span>
      ) : (
        <span className="not-loading">
          <div className="loader h-6"></div>
          <p>{text}</p>
          <p>{text}</p>
        </span>
      )}
    </button>
  );
};

export default Button;
