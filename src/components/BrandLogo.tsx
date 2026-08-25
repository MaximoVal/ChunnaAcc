import React from 'react';

export interface BrandLogoProps {
  variant?: 'navbar' | 'stacked' | 'footer' | 'compact' | 'hero';
  starSize?: number;
  textColor?: string;
  subColor?: string;
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'navbar',
  starSize,
  textColor,
  subColor,
  showSubtitle = true,
  className = ''
}) => {
  // SVG de la estrella terracota fiel al logo
  const StarIcon = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="brand-star-icon"
      style={{
        color: textColor || 'var(--color-terracota, #E77A5B)',
        filter: 'drop-shadow(0 1px 2px rgba(231, 122, 91, 0.3))',
        ...style
      }}
    >
      {/* Estrella simétrica de 5 puntas con proporciones del logo */}
      <path d="M12 1.8l3.12 6.32 6.98 1.01-5.05 4.92 1.19 6.95L12 17.72l-6.24 3.28 1.19-6.95L1.9 9.13l6.98-1.01L12 1.8z" />
    </svg>
  );

  if (variant === 'stacked' || variant === 'hero') {
    const isHero = variant === 'hero';
    const computedStarSize = starSize || (isHero ? 34 : 26);

    return (
      <div className={`brand-logo-stacked text-center d-inline-flex flex-column align-items-center ${className}`}>
        <div className="brand-star-wrapper mb-1">
          <StarIcon size={computedStarSize} />
        </div>
        <span
          className="brand-logo-title"
          style={{
            color: textColor || 'var(--color-terracota, #E77A5B)',
            fontSize: isHero ? 'clamp(2.6rem, 5vw, 4rem)' : '2rem',
            lineHeight: 1.05
          }}
        >
          Chunna
        </span>
        {showSubtitle && (
          <span
            className="brand-logo-subtitle"
            style={{
              color: subColor || textColor || 'var(--color-terracota, #E77A5B)',
              fontSize: isHero ? 'clamp(1rem, 2vw, 1.4rem)' : '0.95rem',
              letterSpacing: '3px'
            }}
          >
            Accesorios
          </span>
        )}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`brand-logo-footer d-inline-flex align-items-center gap-3 ${className}`}>
        <div className="brand-logo-badge-round">
          <StarIcon size={starSize || 24} />
        </div>
        <div className="d-flex flex-column">
          <span
            className="brand-logo-title"
            style={{
              color: textColor || 'var(--color-terracota, #E77A5B)',
              fontSize: '1.65rem',
              lineHeight: 1.05
            }}
          >
            Chunna
          </span>
          {showSubtitle && (
            <span
              className="brand-logo-subtitle"
              style={{
                color: subColor || 'var(--color-rosa-pastel, #F7B7BD)',
                fontSize: '0.82rem',
                letterSpacing: '2.5px'
              }}
            >
              ACCESORIOS
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variante Navbar (predeterminada)
  return (
    <div className={`brand-logo-navbar d-inline-flex align-items-center gap-2 ${className}`}>
      <div className="brand-star-wrapper d-flex align-items-center justify-content-center">
        <StarIcon size={starSize || 22} />
      </div>
      <div className="d-flex flex-column justify-content-center">
        <span
          className="brand-logo-title"
          style={{
            color: textColor || 'var(--color-terracota, #E77A5B)',
            fontSize: '1.5rem',
            lineHeight: 1
          }}
        >
          Chunna
        </span>
        {showSubtitle && (
          <span
            className="brand-logo-subtitle"
            style={{
              color: subColor || 'var(--color-terracota, #E77A5B)',
              fontSize: '0.68rem',
              letterSpacing: '1.8px'
            }}
          >
            ACCESORIOS
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
