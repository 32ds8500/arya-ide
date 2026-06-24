import React, { useState, useEffect } from 'react';

export interface ThinkingIndicatorProps {
  message?: string;
  showSteps?: boolean;
  steps?: string[];
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  message = 'Düşünüyor',
  showSteps = false,
  steps = [],
}) => {
  const [dots, setDots] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : `${prev  }.`));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showSteps && steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [showSteps, steps.length]);

  return (
    <div style={styles.container}>
      <div style={styles.animation}>
        <div style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <span style={styles.text}>
          {message}
          <span style={styles.dotsText}>{dots}</span>
        </span>
      </div>

      {showSteps && steps.length > 0 && (
        <div style={styles.steps}>
          <div style={styles.stepIndicator}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.stepDot,
                  ...(i === currentStep ? styles.stepDotActive : {}),
                  ...(i < currentStep ? styles.stepDotDone : {}),
                }}
              />
            ))}
          </div>
          <span style={styles.stepText}>{steps[currentStep]}</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 0',
  },
  animation: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dots: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#7aa2f7',
    animation: 'thinkingPulse 1.4s ease-in-out infinite',
  },
  text: {
    color: '#737aa2',
    fontSize: 13,
  },
  dotsText: {
    display: 'inline-block',
    width: 20,
    textAlign: 'left',
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingLeft: 2,
  },
  stepIndicator: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  stepDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#3b4261',
    transition: 'background 0.3s',
  },
  stepDotActive: {
    background: '#7aa2f7',
    width: 6,
    height: 6,
  },
  stepDotDone: {
    background: '#9ece6a',
  },
  stepText: {
    color: '#565f89',
    fontSize: 12,
    fontStyle: 'italic',
  },
};

export default React.memo(ThinkingIndicator);
