import React, { useEffect, useState, useRef } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewDay, createViewWeek, createViewMonthGrid, CalendarEventExternal } from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import '@schedule-x/theme-default/dist/index.css';
import Box from '@cloudscape-design/components/box';
import { NodePool } from '../types/karpenter';
import { generateEventsFromCron } from '../utils/cronParser';
import { humanReadableBudget } from '../utils/budgetHelpers';
import dayjs from 'dayjs';

import './DisruptionCalendar.css';

interface DisruptionCalendarProps {
  nodePool: NodePool | null;
  selectedDate: Date;
}

const DisruptionCalendar: React.FC<DisruptionCalendarProps> = ({ nodePool, selectedDate }) => {
  // Create ref for the events plugin to ensure it persists between renders
  const eventsPluginRef = useRef(createEventsServicePlugin());
//   const [eventsReady, setEventsReady] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventExternal[]>([]);

  // Create calendar configuration first
  const calendarApp = useCalendarApp({
    // Set default date to selected date
    selectedDate: selectedDate.toISOString().split('T')[0],

    // Define available views
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid()
    ],

    // Include the events plugin - use the ref to ensure stability
    plugins: [eventsPluginRef.current],

    // Add initial events (empty array, we'll update later)
    events: [],

    // Translations and formatting
    locale: 'en-US',
  });

  // Process events from nodePool (cron expressions)
  useEffect(() => {
    if (!nodePool?.spec?.disruption?.budgets) {
      return;
    }

    // Generate events for the calendar based on cron expressions
    const generatedEvents: CalendarEventExternal[] = [];
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
            start: dayjs(event.start).format('YYYY-MM-DD HH:mm'),
            end: dayjs(event.end).format('YYYY-MM-DD HH:mm'),
            color: isZeroNodes ? '#D13212' : '#0972D3', // AWS colors
            editable: false, // Disable editing/dragging
            description: JSON.stringify(event.resource?.budget, null, 2),
            allDay: false
          });
        });
      });

    // Save the generated events
    setCalendarEvents(generatedEvents);
    console.log('Generated events:', generatedEvents);
  }, [nodePool, selectedDate]);

  // Apply events to calendar AFTER it's fully initialized
  useEffect(() => {
    // Skip if calendar or events aren't ready
    // // if (!calendarApp || !eventsReady || calendarEvents.length === 0) {
    //   console.log('Waiting for calendar initialization or events:', {
    //     calendarReady: !!calendarApp,
    //     eventsReady,
    //     eventsCount: calendarEvents.length
    //   });
    //   return;
    // }

    console.log('Attempting to set calendar events');

    // Try both methods for setting events
    try {
      // METHOD 1: Direct plugin access
      console.log('Setting events via plugin directly');
      const plugin = eventsPluginRef.current;
    //   if (plugin && typeof plugin.set === 'function') {
        plugin.set(calendarEvents);
        console.log('Events set via plugin successfully');
    //   } else {
    //     console.warn('Plugin set method not available, trying calendar.events');
    //   }

      // METHOD 2: Calendar events API
    //   if (calendarApp?.events && typeof calendarApp.events.set === 'function') {
    //     console.log('Setting events via calendarApp.events');
    //     calendarApp.events.set(calendarEvents);
    //     console.log('Events set via calendarApp.events successfully');
    //   }
    } catch (error) {
      console.error('Error setting events:', error);
    }
  }, [calendarApp, calendarEvents]);

  if (!calendarApp) {
    return <div>Loading calendar...</div>;
  }

  return (
    <Box padding="m">
      <div style={{
        height: 500,
        maxHeight: '70vh',
        overflow: 'auto',
        width: '100%'
      }}>
        <ScheduleXCalendar calendarApp={calendarApp} />
      </div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        {calendarEvents.length > 0 ?
          `Showing ${calendarEvents.length} budget events` :
          'No disruption budget events to display'}
      </div>
    </Box>
  );
};

export default DisruptionCalendar;
