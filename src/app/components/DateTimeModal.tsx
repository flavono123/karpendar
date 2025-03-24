import _ from 'lodash';

import {
  Box,
  StatusIndicator,
  TextContent,
  SpaceBetween,
} from '@cloudscape-design/components';
import React, { useEffect, useRef, useState } from 'react';

import * as awsui from '@cloudscape-design/design-tokens/index.js';
import { DisruptionBudget } from '../types/karpenter';
import { calculateAtTimeBudgets } from '../utils/budgetHelpers';

interface DateTimeModalProps {
  datetime: Date | null;
  position: { top: number; left: number } | null;
  isOpen: boolean;
  onClose: () => void;
  getIndicatorElement?: () => HTMLElement | null;
  getCalendarElement?: () => HTMLElement | null;
  budgets: DisruptionBudget[];
}

const DateTimeModal: React.FC<DateTimeModalProps> = ({
  datetime,
  position: initialPosition,
  isOpen,
  onClose,
  getIndicatorElement,
  budgets,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [statuses, setStatuses] = useState<
    {
      reasonString: string;
      nodesOrPercentage: string;
      type: 'success' | 'warning' | 'error';
    }[]
  >([]);

  // Update position when scrolling or resizing
  useEffect(() => {
    if (!isOpen || !getIndicatorElement) return;

    const updatePosition = () => {
      const indicatorElement = getIndicatorElement();
      if (!indicatorElement || !modalRef.current) return;

      const indicatorRect = indicatorElement.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Constants
      const SPACING = 10;
      const modalWidth = modalRect.width || 240; // Default width from styles
      const modalHeight = modalRect.height || 100; // Default minimum height

      // Calculate available space in each direction
      const spaceRight = viewportWidth - indicatorRect.right - SPACING;
      const spaceLeft = indicatorRect.left - SPACING;
      const spaceBelow = viewportHeight - indicatorRect.bottom - SPACING;
      const spaceAbove = indicatorRect.top - SPACING;

      // Add multiplying factors to prioritize certain positions
      // These factors make the algorithm more sensitive to edge proximity
      const spaceRightFactor = spaceRight * 0.3; // Reduce right priority slightly
      const spaceBelowFactor = spaceBelow * 0.3; // Reduce bottom priority slightly

      // Default position (right of indicator)
      let top = indicatorRect.top + SPACING;
      let left = indicatorRect.right + SPACING;

      // Determine horizontal position - always left or right, never center
      if (spaceRight < modalWidth || spaceRightFactor < modalWidth) {
        // Not enough space on right, try to position left
        left = indicatorRect.left - modalWidth - SPACING;
      }

      // If left positioning would place modal outside viewport, force right positioning
      // but adjust to keep within bounds
      if (left < SPACING) {
        left = Math.min(
          indicatorRect.right + SPACING,
          viewportWidth - modalWidth - SPACING
        );
      }

      // Determine vertical position - always top or bottom, never center vertically
      if (spaceBelow < modalHeight || spaceBelowFactor < modalHeight) {
        // Not enough space below, try to position above
        top = indicatorRect.top - modalHeight - SPACING;
      } else {
        // Position below the indicator
        top = indicatorRect.bottom + SPACING;
      }

      // If top positioning would place modal outside viewport, force bottom positioning
      // but adjust to keep within bounds
      if (top < SPACING) {
        top = Math.min(
          indicatorRect.bottom + SPACING,
          viewportHeight - modalHeight - SPACING
        );
      }

      // Ensure modal stays within viewport bounds
      top = Math.max(
        SPACING,
        Math.min(top, viewportHeight - modalHeight - SPACING)
      );
      left = Math.max(
        SPACING,
        Math.min(left, viewportWidth - modalWidth - SPACING)
      );

      setPosition({ top, left });
    };

    // Initial position update needs a small delay to ensure modal DOM is ready
    setTimeout(updatePosition, 0);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, getIndicatorElement]);

  useEffect(() => {
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

  useEffect(() => {
    if (!datetime) return;
    const atTimeBudgets = calculateAtTimeBudgets(budgets, datetime);
    const groups = _.groupBy(atTimeBudgets, 'nodesOrPercentage');
    setStatuses(
      Object.keys(groups).map(nodesOrPercentage => {
        const reasonString = groups[nodesOrPercentage]
          .map(
            atTimeBudget =>
              atTimeBudget.reason.charAt(0).toUpperCase() +
              atTimeBudget.reason.slice(1)
          )
          .sort()
          .join(', ');

        const type = nodesOrPercentage === '0' ? 'error' : 'success';

        if (reasonString === 'Drifted, Empty, Underutilized') {
          return {
            reasonString: 'All',
            nodesOrPercentage: nodesOrPercentage,
            type,
          };
        }

        return {
          reasonString,
          nodesOrPercentage: nodesOrPercentage,
          type,
        };
      })
    );
  }, [budgets, datetime]);

  // Format datetime into absolute timestamp with minutes precision
  const formatAbsoluteTimestamp = (date: Date) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    // Format time with leading zeros for hours and minutes
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Get timezone offset in format UTC±h:mm
    const tzOffset = date.getTimezoneOffset();
    const tzSign = tzOffset <= 0 ? '+' : '-';
    const tzHours = Math.floor(Math.abs(tzOffset) / 60)
      .toString()
      .padStart(2, '0');
    const tzMinutes = (Math.abs(tzOffset) % 60).toString().padStart(2, '0');

    return `${month} ${day}, ${year}, ${hours}:${minutes} (UTC${tzSign}${tzHours}:${tzMinutes})`;
  };

  if (!isOpen || !position || !datetime) return null;

  return (
    <>
      {statuses.length > 0 && (
        <div
          ref={modalRef}
          className="sx__datetime-modal"
          style={{
            position: 'fixed', // for fixing when scrolling
            top: `${position.top}px`,
            left: `${position.left}px`,
            backgroundColor: awsui.colorBackgroundPopover,
            boxShadow: awsui.shadowContainerActive,
            borderRadius: '4px',
            padding: '12px',
            minWidth: '240px',
          }}
        >
          <Box>
            <TextContent>
              <SpaceBetween size="xs">
                {statuses.map(status => (
                  <StatusIndicator
                    key={status.nodesOrPercentage}
                    type={status.type}
                  >
                    {`${status.nodesOrPercentage} for ${status.reasonString}`}
                  </StatusIndicator>
                ))}
                <div
                  style={{
                    fontSize: awsui.fontSizeBodyS,
                    color: awsui.colorTextBodySecondary,
                    marginTop: awsui.spaceScaledXs,
                  }}
                >
                  {formatAbsoluteTimestamp(datetime)}
                </div>
              </SpaceBetween>
            </TextContent>
          </Box>
        </div>
      )}
    </>
  );
};

export default DateTimeModal;
