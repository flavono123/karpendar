import React, { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewDay, createViewWeek, createViewMonthGrid } from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import Box from '@cloudscape-design/components/box';
import { NodePool } from '../types/karpenter';
import { generateEventsFromCron } from '../utils/cronParser';
import { humanReadableBudget } from '../utils/budgetHelpers';
import dayjs from 'dayjs';

interface DisruptionCalendarProps {
  nodePool: NodePool | null;
  selectedDate: Date;
}

const DisruptionCalendar: React.FC<DisruptionCalendarProps> = ({ nodePool, selectedDate }) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Generate events for the calendar based on cron expressions
    const generatedEvents: any[] = [];

    if (nodePool?.spec?.disruption?.budgets) {
      const { budgets } = nodePool.spec.disruption;

      // Generate start date (beginning of week) and end date (end of week)
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Go to beginning of week (Sunday)
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7); // End of week

      // Convert cron-based events to Schedule-X format
      budgets
        .filter(budget => budget.schedule)
        .forEach((budget, index) => {
          const budgetEvents = generateEventsFromCron(budget, startDate, endDate);

          budgetEvents.forEach((event, eventIndex) => {
            const isZeroNodes = event.resource?.nodes === '0';

            generatedEvents.push({
              id: `budget-${index}-event-${eventIndex}`,
              title: `${humanReadableBudget(budget)} - Nodes: ${event.resource?.nodes || '0'}`,
              start: dayjs(event.start).format('YYYY-MM-DDTHH:mm:ss'),
              end: dayjs(event.end).format('YYYY-MM-DDTHH:mm:ss'),
              color: isZeroNodes ? '#D13212' : '#0972D3', // AWS colors
              editable: false, // Disable editing/dragging
              description: JSON.stringify(event.resource?.budget, null, 2)
            });
          });
        });
    }

    setEvents(generatedEvents);
  }, [nodePool, selectedDate]);

  // Create calendar configuration using the new API
  const calendarApp = useCalendarApp({
    // Set default date to selected date
    selectedDate: selectedDate.toISOString().split('T')[0],

    // Define available views
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid()
    ],

    // Add events
    events: events,

    // Translations and formatting
    locale: 'en-US',

    // Callbacks for events
    callbacks: {
      onEventClick: (event: any) => {
        alert(`${event.title}\n\nStart: ${event.start}\nEnd: ${event.end}\n\n${event.description || ''}`);
      }
    }
  });

  if (!calendarApp) {
    return <div>Loading calendar...</div>;
  }

  return (
    <Box padding="m">
      <div style={{ height: 600 }}>
        <ScheduleXCalendar calendarApp={calendarApp} />
      </div>
    </Box>
  );
};

export default DisruptionCalendar;
