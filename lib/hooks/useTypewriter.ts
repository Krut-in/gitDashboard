/**
 * Custom hook for typewriter animation effect
 * 
 * This hook creates a typewriter effect that can erase old text and type new text.
 * It manages the animation state and timing for smooth character-by-character animations.
 * 
 * Key Features:
 * - Automatically starts typing on mount
 * - Smoothly transitions between different text content
 * - Erases old text before typing new content
 * - Configurable animation speeds and delays
 * - Provides animation state for visual feedback
 * 
 * @param text - The text to display with typewriter effect
 * @param eraseSpeed - Speed of character removal in milliseconds (default: 30ms)
 * @param typeSpeed - Speed of character addition in milliseconds (default: 40ms)
 * @param delayBetweenEraseAndType - Delay between erase completion and typing start (default: 250ms)
 * @param onEraseComplete - Optional callback when erase animation completes
 * @param onTypeComplete - Optional callback when type animation completes
 * 
 * @returns Object containing displayText and animation state flags
 */

import { useState, useEffect, useRef } from 'react';

interface TypewriterOptions {
  text: string;
  eraseSpeed?: number;
  typeSpeed?: number;
  delayBetweenEraseAndType?: number;
  onEraseComplete?: () => void;
  onTypeComplete?: () => void;
}

export function useTypewriter({
  text,
  eraseSpeed = 30,
  typeSpeed = 40,
  delayBetweenEraseAndType = 250,
  onEraseComplete,
  onTypeComplete,
}: TypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);
  const previousTextRef = useRef<string>('');
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // If this is the first render, start typing immediately
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      let currentIndex = 0;
      setIsAnimating(true);

      const typeInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsAnimating(false);
          previousTextRef.current = text;
          onTypeComplete?.();
        }
      }, typeSpeed);

      return () => clearInterval(typeInterval);
    }

    // If text hasn't changed, do nothing
    if (text === previousTextRef.current) return;

    // Text has changed - erase then type
    setIsAnimating(true);
    let currentIndex = displayText.length;

    // Erase phase
    const eraseInterval = setInterval(() => {
      if (currentIndex > 0) {
        currentIndex--;
        setDisplayText((prev) => prev.slice(0, -1));
      } else {
        clearInterval(eraseInterval);
        onEraseComplete?.();

        // Delay before typing
        setTimeout(() => {
          let typeIndex = 0;

          // Type phase
          const typeInterval = setInterval(() => {
            if (typeIndex <= text.length) {
              setDisplayText(text.slice(0, typeIndex));
              typeIndex++;
            } else {
              clearInterval(typeInterval);
              setIsAnimating(false);
              previousTextRef.current = text;
              onTypeComplete?.();
            }
          }, typeSpeed);
        }, delayBetweenEraseAndType);
      }
    }, eraseSpeed);

    return () => {
      clearInterval(eraseInterval);
    };
  }, [text, typeSpeed, eraseSpeed, delayBetweenEraseAndType, onEraseComplete, onTypeComplete]);

  return {
    displayText,
    isAnimating,
  };
}
