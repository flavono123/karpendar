import React, { useEffect, useRef, useState } from 'react';

interface DateTimeModalProps {
  datetime: Date | null;
  position: { top: number; left: number } | null;
  isOpen: boolean;
  onClose: () => void;
  getIndicatorElement?: () => HTMLElement | null; // Function to get the current indicator element
}

const DateTimeModal: React.FC<DateTimeModalProps> = ({
  datetime,
  position: initialPosition,
  isOpen,
  onClose,
  getIndicatorElement,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);

  // Update position when scrolling or resizing
  useEffect(() => {
    if (!isOpen || !getIndicatorElement) return;

    const updatePosition = () => {
      const indicatorElement = getIndicatorElement();
      if (indicatorElement) {
        const rect = indicatorElement.getBoundingClientRect();
        setPosition({
          top: rect.top,
          left: rect.right + 20, // Position to the right of the indicator with some spacing
        });
      }
    };

    // Set initial position
    updatePosition();

    // Add scroll and resize event listeners
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, getIndicatorElement]);

  useEffect(() => {
    // Handle clicks outside the modal
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  return (
    <div
      ref={modalRef}
      className="sx__datetime-modal"
      style={{
        position: 'fixed', // Changed from 'absolute' to 'fixed' to stay in view when scrolling
        top: `${position.top}px`,
        left: `${position.left}px`,
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
        padding: '12px',
        minWidth: '200px',
        zIndex: 1000,
      }}
    >
      <div className="sx__datetime-modal-header">
        <h3>
          {datetime?.toLocaleTimeString()} on {datetime?.toLocaleDateString()}
        </h3>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
      <div className="sx__datetime-modal-content">
        {/* Add your custom content or Cloudscape components here */}
        <p>Your custom modal content here</p>
      </div>
    </div>
  );
};

export default DateTimeModal;
