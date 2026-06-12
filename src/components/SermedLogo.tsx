export const SermedLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md'
}) => {
  const sizeMap = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-16'
  };

  return (
    <img
      src="/logos/logo sermed.png"
      alt="Sermed Logo"
      className={`${sizeMap[size]} ${className}`}
    />
  );
};
