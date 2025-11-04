"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  text: string;
  disabled?: boolean;
}

export function SwipeButton({ onSwipeComplete, text, disabled = false }: SwipeButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleStart = (clientX: number) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    startXRef.current = clientX - dragPosition;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || isCompleted) return;

    const container = containerRef.current;
    const slider = sliderRef.current;
    if (!container || !slider) return;

    const containerWidth = container.offsetWidth;
    const sliderWidth = slider.offsetWidth;
    const maxDrag = containerWidth - sliderWidth;

    let newPosition = clientX - startXRef.current;
    newPosition = Math.max(0, Math.min(newPosition, maxDrag));

    setDragPosition(newPosition);

    // Check if completed (90% threshold)
    if (newPosition >= maxDrag * 0.9) {
      setIsCompleted(true);
      setIsDragging(false);
      setDragPosition(maxDrag);
      setTimeout(() => {
        onSwipeComplete();
      }, 200);
    }
  };

  const handleEnd = () => {
    if (disabled || isCompleted) return;
    setIsDragging(false);

    // If not completed, reset position
    if (!isCompleted) {
      setDragPosition(0);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("mousemove", handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [isDragging]);

  const progress = containerRef.current
    ? (dragPosition / (containerRef.current.offsetWidth - (sliderRef.current?.offsetWidth || 0))) * 100
    : 0;

  return (
    <div
      ref={containerRef}
      className={`relative h-14 bg-gray-100 rounded-full overflow-hidden select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Progress */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-200"
        style={{ width: `${progress}%` }}
      />

      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-sm font-semibold transition-all duration-200 ${
            progress > 50 ? "text-white" : "text-gray-600"
          }`}
        >
          {isCompleted ? "✓ Hoàn tất!" : text}
        </span>
      </div>

      {/* Slider Button */}
      <div
        ref={sliderRef}
        className={`absolute top-1 left-1 h-12 w-12 bg-black rounded-full shadow-lg flex items-center justify-center transition-transform ${
          isDragging ? "scale-110" : "scale-100"
        } ${isCompleted ? "bg-green-600" : "bg-black"}`}
        style={{
          transform: `translateX(${dragPosition}px)`,
          transition: isDragging || isCompleted ? "none" : "transform 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </div>

      {/* Ripple effect on complete */}
      {isCompleted && (
        <div className="absolute inset-0 bg-green-500 animate-ping opacity-25 rounded-full" />
      )}
    </div>
  );
}
