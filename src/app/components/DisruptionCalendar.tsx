import React, { useRef, useEffect, useState } from 'react';
import { useNextCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
  toDateString,
  CalendarEvent,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import '@schedule-x/theme-default/dist/index.css';
import Box from '@cloudscape-design/components/box';

import './DisruptionCalendar.css';
import { DisruptionBudget } from '../types/karpenter';
import { generateEvents } from '../utils/cronParser';
import { startOfMonth, endOfMonth } from 'date-fns';
import { StatusIndicator } from '@cloudscape-design/components';
import { createDateTimeIndicatorWithCloudscapeModalPlugin } from '../plugins/datetime-indicator-with-modal-plugin';

import '../plugins/datetime-indicator-with-modal-plugin.css';
import * as awsui from '@cloudscape-design/design-tokens/index.js';

interface DisruptionCalendarProps {
  budgets: DisruptionBudget[];
}

const DisruptionCalendar: React.FC<DisruptionCalendarProps> = ({ budgets }) => {
  const today = new Date();
  const calendars = {
    All: {
      colorName: 'blue',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical1,
        container: '#ddf4ff', // $color-charts-blue-1-1200 dark
        onContainer: awsui.colorChartsPaletteCategorical6,
      },
    },
    Drifted: {
      colorName: 'pink',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical2,
        container: '#ffecf1', // $color-charts-pink-1200 dark
        onContainer: awsui.colorChartsPaletteCategorical7,
      },
    },
    Empty: {
      colorName: 'teal',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical3,
        container: '#d7f7f0', // $color-charts-teal-1200 dark
        onContainer: awsui.colorChartsPaletteCategorical8,
      },
    },
    Underutilized: {
      colorName: 'purple',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical4,
        container: '#f5edff', // $color-charts-purple-1200 dark
        onContainer: awsui.colorChartsPaletteCategorical9,
      },
    },
    'Drifted-Empty': {
      colorName: 'navy',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical11,
        container: '#caedfc', // $color-charts-blue-1-1100 dark
        onContainer: awsui.colorChartsPaletteCategorical16,
      },
    },
    'Empty-Underutilized': {
      colorName: 'mauve',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical22,
        container: '#ffdfe8', // $color-charts-pink-1100 dark
        onContainer: awsui.colorChartsPaletteCategorical27,
      },
    },
    'Drifted-Underutilized': {
      colorName: 'magenta',
      lightColors: {
        main: awsui.colorChartsPaletteCategorical24,
        container: '#efe2ff', // $color-charts-purple-1100 dark
        onContainer: awsui.colorChartsPaletteCategorical29,
      },
    },
  };
  const eventsPluginRef = useRef(createEventsServicePlugin());
  const datetimeIndicatorPluginRef = useRef(
    createDateTimeIndicatorWithCloudscapeModalPlugin()
  );
  const [visiableRange, setVisiableRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  useEffect(() => {
    const datetimeIndicator = datetimeIndicatorPluginRef.current;
    if (datetimeIndicator && datetimeIndicator.setBudgets && budgets) {
      datetimeIndicator.setBudgets(budgets);
    }
  }, [budgets]);

  const calendarApp = useNextCalendarApp({
    selectedDate: toDateString(new Date()),
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    plugins: [eventsPluginRef.current, datetimeIndicatorPluginRef.current],
    events: [],
    locale: 'en-US',
    calendars,
    callbacks: {
      onRangeUpdate: range => {
        setVisiableRange({
          start: new Date(range.start),
          end: new Date(range.end),
        });
      },
      onClickDateTime: dateTime => {
        const datetimeIndicator = datetimeIndicatorPluginRef.current;
        datetimeIndicator.setDatetime(new Date(dateTime));
      },
      onEventClick: (calendarEvent: CalendarEvent, e: any) => {
        if (
          toDateString(new Date(calendarEvent.start)) !==
          toDateString(new Date(calendarEvent.end))
        ) {
          return;
        }
        const datetimeIndicator = datetimeIndicatorPluginRef.current;
        const target = e.target as HTMLElement;
        const rect = target.closest('.sx__event')?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const relativeY = (e.clientY - rect.top) / rect.height;

        // Calculate precise time based on position
        const startTime = new Date(calendarEvent.start).getTime();
        const endTime = new Date(calendarEvent.end).getTime();
        const clickedTime = new Date(
          startTime + (endTime - startTime) * relativeY
        );

        datetimeIndicator.setDatetime(clickedTime);
      },
    },
  });

  useEffect(() => {
    if (!budgets) {
      return;
    }

    try {
      const plugin = eventsPluginRef.current;
      //   debugger;
      const events = budgets.flatMap((budget, index) =>
        generateEvents(budget, index, visiableRange)
      );
      plugin.set(events);
    } catch (error) {
      console.error('Error setting events:', error);
    }
  }, [budgets, visiableRange]);

  if (!calendarApp) {
    return (
      <Box padding="m">
        <StatusIndicator type="loading">Loading calendar...</StatusIndicator>
      </Box>
    );
  }

  return (
    <Box padding="m">
      <div id="calendar-container">
        <ScheduleXCalendar calendarApp={calendarApp} />
      </div>
    </Box>
  );
};

export default DisruptionCalendar;
