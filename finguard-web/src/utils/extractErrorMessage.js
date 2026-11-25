export function extractApiError(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;

  const codePrefix = data.errorCode ? `[${data.errorCode}] ` : '';
  const baseMessage = data.message || data.error || fallback;

  const fieldMap = data.fieldErrors || data.validationErrors;
  if (fieldMap && typeof fieldMap === 'object' && Object.keys(fieldMap).length > 0) {
    const details = Object.entries(fieldMap)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(' • ');
    return `${codePrefix}${baseMessage} (${details})`;
  }

  return `${codePrefix}${baseMessage}`;
}
