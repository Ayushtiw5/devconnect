import './Input.css';

function Input({
  type = 'text',
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon,
  className = '',
  ...props
}) {
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={name} className="input-group__label">
          {label}
          {required && <span className="input-group__required">*</span>}
        </label>
      )}
      <div className="input-group__wrapper">
        {icon && <span className="input-group__icon">{icon}</span>}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`input-group__input ${icon ? 'input-group__input--with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}

export default Input;
