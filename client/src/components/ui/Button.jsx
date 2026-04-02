import { Link } from 'react-router-dom';
import './Button.css';

function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  to,
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const widthClass = fullWidth ? 'btn--full' : '';
  const disabledClass = disabled || loading ? 'btn--disabled' : '';
  const classes = `${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass} ${className}`.trim();

  const content = loading ? (
    <span className="btn__loading">
      <span className="btn__spinner"></span>
      <span>{children}</span>
    </span>
  ) : (
    children
  );

  // If 'to' prop is provided, render as Link
  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}

export default Button;
