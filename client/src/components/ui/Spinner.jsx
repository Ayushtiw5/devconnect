import './Spinner.css';

function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`spinner spinner--${size} ${className}`}>
      <div className="spinner__circle"></div>
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <Spinner size="lg" />
      <p className="page-spinner__text">Loading...</p>
    </div>
  );
}

export default Spinner;
