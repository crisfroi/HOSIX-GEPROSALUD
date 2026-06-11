export const SermedLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <svg
      viewBox="0 0 200 200"
      className={`${sizeMap[size]} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue curved path (top-right) */}
      <path
        d="M 100 40 Q 140 60, 140 100 Q 140 140, 100 160"
        stroke="#0066CC"
        strokeWidth="20"
        strokeLinecap="round"
      />
      
      {/* Green curved path (bottom-left) */}
      <path
        d="M 100 40 Q 60 60, 60 100 Q 60 140, 100 160"
        stroke="#00B050"
        strokeWidth="20"
        strokeLinecap="round"
      />
      
      {/* Center circle */}
      <circle cx="100" cy="100" r="12" fill="#0066CC" />
      <circle cx="100" cy="100" r="8" fill="#00B050" />
    </svg>
  );
};
