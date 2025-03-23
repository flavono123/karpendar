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
  getIndicatorElement?: () => HTMLElement | null; // Function to get the current indicator element
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
      if (indicatorElement) {
        const rect = indicatorElement.getBoundingClientRect();
        setPosition({
          top: rect.top,
          left: rect.right + 20, // Position to the right of the indicator with some spacing
        });
      }
    };

    updatePosition();

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
              </SpaceBetween>
            </TextContent>
          </Box>
        </div>
      )}
    </>
  );
};

export default DateTimeModal;
