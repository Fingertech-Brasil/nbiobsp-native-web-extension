const Button = ({ id, text, loading = false, onClick = () => {} }) => {
  return (
    <button id={id} className="button" disabled={loading} onClick={onClick}>
      <span className={`${loading ? "loading" : "not-loading"}`}>
        <div className="flex h-6 w-24 overflow-visible mx-auto">
          <div className="loader"></div>
          <div className="loader"></div>
          <div className="loader"></div>
        </div>
        <p className="justify-center inline-flex h-6">{text}</p>
        <p>{text}</p>
      </span>
    </button>
  );
};

export default Button;
