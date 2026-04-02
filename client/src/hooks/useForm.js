import { useState, useCallback } from 'react';

/**
 * Hook for handling form state
 */
function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const validate = useCallback((validationRules) => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach((field) => {
      const rules = validationRules[field];
      const value = values[field];

      if (rules.required && !value) {
        newErrors[field] = rules.required === true 
          ? `${field} is required` 
          : rules.required;
      } else if (rules.minLength && value.length < rules.minLength) {
        newErrors[field] = `Minimum ${rules.minLength} characters required`;
      } else if (rules.maxLength && value.length > rules.maxLength) {
        newErrors[field] = `Maximum ${rules.maxLength} characters allowed`;
      } else if (rules.pattern && !rules.pattern.test(value)) {
        newErrors[field] = rules.patternMessage || 'Invalid format';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    setValue,
    setValues,
    setErrors,
    setIsSubmitting,
    reset,
    validate,
  };
}

export default useForm;
