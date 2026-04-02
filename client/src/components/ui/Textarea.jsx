import './Textarea.css';

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  ...props
}) {
  return (
    <div className={`textarea-group ${error ? 'textarea-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={name} className="textarea-group__label">
          {label}
          {required && <span className="textarea-group__required">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className="textarea-group__input"
        {...props}
      />
      <div className="textarea-group__footer">
        {error && <span className="textarea-group__error">{error}</span>}
        {maxLength && (
          <span className="textarea-group__count">
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export default Textarea;
