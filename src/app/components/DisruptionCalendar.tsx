import React, { useRef, useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
  toDateString,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import '@schedule-x/theme-default/dist/index.css';
import Box from '@cloudscape-design/components/box';

import './DisruptionCalendar.css';
import { DisruptionBudget } from '../types/karpenter';
import { generateEventsFromBudget } from '../utils/cronParser';
import { createDateTimeIndicatorPlugin } from '../plugins/datetime-indicator-plugin';
import '../plugins/datetime-indicator.css';

import * as awsui from '@cloudscape-design/design-tokens/index.js';
import { startOfMonth, endOfMonth } from 'date-fns';
import { preventDefault } from 'ace-builds-internal/lib/event';
import { StatusIndicator } from '@cloudscape-design/components';

interface DisruptionCalendarProps {
  budgets: DisruptionBudget[];
}

const DisruptionCalendar: React.FC<DisruptionCalendarProps> = ({ budgets }) => {
  const today = new Date();
  const eventsPluginRef = useRef(createEventsServicePlugin());
  const datetimeIndicatorPluginRef = useRef(createDateTimeIndicatorPlugin());
  const [visiableRange, setVisiableRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  const calendarApp = useCalendarApp({
    selectedDate: toDateString(new Date()),
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    plugins: [
      eventsPluginRef.current,
      createEventModalPlugin(),
      datetimeIndicatorPluginRef.current,
    ],
    events: [],
    locale: 'en-US',
    calendars: {
      calendar1: {
        colorName: 'blue',
        lightColors: {
          main: awsui.colorChartsPaletteCategorical1,
          container: '#ddf4ff', // $color-charts-blue-1-1200 dark
          onContainer: awsui.colorChartsPaletteCategorical6,
        },
      },
      calendar2: {
        colorName: 'pink',
        lightColors: {
          main: awsui.colorChartsPaletteCategorical2,
          container: '#ffecf1', // $color-charts-pink-1200 dark
          onContainer: awsui.colorChartsPaletteCategorical7,
        },
      },
      calendar3: {
        colorName: 'teal',
        lightColors: {
          main: awsui.colorChartsPaletteCategorical3,
          container: '#d7f7f0', // $color-charts-teal-1200 dark
          onContainer: awsui.colorChartsPaletteCategorical8,
        },
      },
      calendar4: {
        colorName: 'purple',
        lightColors: {
          main: awsui.colorChartsPaletteCategorical4,
          container: '#f5edff', // $color-charts-purple-1200
          onContainer: awsui.colorChartsPaletteCategorical9,
        },
      },
      calendar5: {
        colorName: 'orange',
        lightColors: {
          main: awsui.colorChartsPaletteCategorical5,
          container: '#ffede2', // $color-charts-green-1200
          onContainer: awsui.colorChartsPaletteCategorical10,
        },
      },
    },
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
      onEventClick: calendarEvent => {
        const datetimeIndicator = datetimeIndicatorPluginRef.current;
        const eventStart = new Date(calendarEvent.start);
        const eventEnd = new Date(calendarEvent.end);
        const middleTime = new Date(
          (eventStart.getTime() + eventEnd.getTime()) / 2
        );
        datetimeIndicator.setDatetime(middleTime);
      },
    },
  });

  useEffect(() => {
    if (!budgets) {
      return;
    }

    try {
      const plugin = eventsPluginRef.current;
      const events = budgets.flatMap((budget, index) =>
        generateEventsFromBudget(budget, index, visiableRange)
      );
      plugin.set(events);
    } catch (error) {
      console.error('Error setting events:', error);
    }
  }, [calendarApp, budgets, visiableRange]);

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
        <ScheduleXCalendar
          calendarApp={calendarApp}
          //   customComponents={{
          //     eventModal: () => {
          //       return <div>Hello</div>;
          //     },
          //   }}
        />
      </div>
    </Box>
  );
};

export default DisruptionCalendar;
