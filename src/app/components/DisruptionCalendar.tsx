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
import { generateEventsFromBudget } from '../utils/cronParser';
import { startOfMonth, endOfMonth } from 'date-fns';
import {
  StatusIndicator,
  Container,
  TextContent,
} from '@cloudscape-design/components';
import { createDateTimeIndicatorWithCloudscapeModalPlugin } from '../plugins/datetime-indicator-with-modal-plugin';

import '../plugins/datetime-indicator-with-modal-plugin.css';
import * as awsui from '@cloudscape-design/design-tokens/index.js';
interface DisruptionCalendarProps {
  budgets: DisruptionBudget[];
}

const DisruptionCalendar: React.FC<DisruptionCalendarProps> = ({ budgets }) => {
  const today = new Date();
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

  const CustomTimeGridEvent = ({
    calendarEvent,
  }: {
    calendarEvent: CalendarEvent;
  }) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Calculate relative Y position
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top) / rect.height;

      // Calculate precise time based on position
      const startTime = new Date(calendarEvent.start).getTime();
      const endTime = new Date(calendarEvent.end).getTime();
      const clickedTime = new Date(
        startTime + (endTime - startTime) * relativeY
      );

      console.log('clickedTime', clickedTime);
      // Call your handler with the calculated time
      datetimeIndicatorPluginRef.current.setDatetime(clickedTime);

      // Prevent default to avoid standard onEventClick
      e.stopPropagation();
    };

    return (
      <div
        className="custom-event"
        style={{ height: '100%' }}
        onClick={handleClick}
      >
        <Container>
          <TextContent>{calendarEvent.title}</TextContent>
          {/* <Icon name="search" /> */}
        </Container>
      </div>
    );
  };

  const calendarApp = useNextCalendarApp({
    selectedDate: toDateString(new Date()),
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    plugins: [
      eventsPluginRef.current,
      //   createEventModalPlugin(),
      datetimeIndicatorPluginRef.current,
    ],
    events: [],
    locale: 'en-US',
    calendars: {
      calendar1: {
        colorName: 'blue', // all
        lightColors: {
          main: awsui.colorChartsPaletteCategorical1,
          container: '#ddf4ff', // $color-charts-blue-1-1200 dark
          onContainer: awsui.colorChartsPaletteCategorical6,
        },
      },
      calendar2: {
        colorName: 'pink', // empty
        lightColors: {
          main: awsui.colorChartsPaletteCategorical2,
          container: '#ffecf1', // $color-charts-pink-1200 dark
          onContainer: awsui.colorChartsPaletteCategorical7,
        },
      },
      calendar3: {
        colorName: 'teal', //  drift
        lightColors: {
          main: awsui.colorChartsPaletteCategorical3,
          container: '#d7f7f0', // $color-charts-teal-1200 dark
          onContainer: awsui.colorChartsPaletteCategorical8,
        },
      },
      calendar4: {
        colorName: 'purple', // underutilized
        lightColors: {
          main: awsui.colorChartsPaletteCategorical4,
          container: '#f5edff', // $color-charts-purple-1200
          onContainer: awsui.colorChartsPaletteCategorical9,
        },
      },
      calendar5: {
        colorName: 'orange', // TODO: REMOVE
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
        // datetimeIndicator.toggleModal();
      },
      onEventClick: (calendarEvent, e: any) => {
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
        // datetimeIndicator.toggleModal();
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
          //     timeGridEvent: CustomTimeGridEvent,
          //   }}
        />
      </div>
    </Box>
  );
};

export default DisruptionCalendar;
