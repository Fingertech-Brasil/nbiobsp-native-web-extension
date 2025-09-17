const Button = ({ id, text, loading = false, onClick = () => {} }) => {
  return (
    <button id={id} className="button" disabled={loading} onClick={onClick}>
      {loading ? (
        <span className="loading">
          <div className="flex">
            <div className="loader"></div>
            <div className="loader"></div>
            <div className="loader"></div>
          </div>
          <p>{text}</p>
        </span>
      ) : (
        <span className="not-loading">
          <div className="flex h-6 overflow-visible">
            <div className="loader"></div>
            <div className="loader"></div>
            <div className="loader"></div>
          </div>
          <p>{text}</p>
          <p>{text}</p>
        </span>
      )}
    </button>
  );
};

export default Button;
