import React from 'react';
import { sanitizeHTML } from '../utils';

interface SanitizedDisplayProps {
  text: string;
  className?: string;
  id?: string;
}

/**
 * A component to safely render user-provided text by sanitizing it.
 * This prevents XSS attacks.
 */
const SanitizedDisplay: React.FC<SanitizedDisplayProps> = ({ text, className, ...props }) => {
  const sanitizedText = sanitizeHTML(text);
  return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizedText }} {...props} />;
};

export default SanitizedDisplay;
