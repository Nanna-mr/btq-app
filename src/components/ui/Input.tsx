import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <label className="form-field">
      {label ? <span className="field-label">{label}</span> : null}
      <input ref={ref} className={`input-control ${className}`} {...props} />
      {error ? <span className="text-sm font-semibold text-red-700">{error}</span> : null}
    </label>
  );
});
