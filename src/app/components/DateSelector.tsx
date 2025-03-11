import React from 'react';
import DatePicker from '@cloudscape-design/components/date-picker';
import TimeInput from '@cloudscape-design/components/time-input';
import FormField from '@cloudscape-design/components/form-field';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import { format, parse } from 'date-fns';

interface DateSelectorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onChange }) => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const timeStr = format(selectedDate, 'HH:mm');

  const handleDateChange = (value: string) => {
    try {
      if (!value) return;

      const newDate = parse(value, 'yyyy-MM-dd', new Date());
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();

      newDate.setHours(hours, minutes);
      onChange(newDate);
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };

  const handleTimeChange = (value: string) => {
    try {
      if (!value) return;

      const [hoursStr, minutesStr] = value.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (isNaN(hours) || isNaN(minutes)) return;

      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    } catch (error) {
      console.error('Error parsing time:', error);
    }
  };

  return (
    <Box padding="m">
      <SpaceBetween direction="horizontal" size="l">
        <FormField label="Date">
          <DatePicker
            value={dateStr}
            onChange={({ detail }) => handleDateChange(detail.value)}
          />
        </FormField>
        <FormField label="Time (UTC)">
          <TimeInput
            value={timeStr}
            onChange={({ detail }) => handleTimeChange(detail.value)}
          />
        </FormField>
      </SpaceBetween>
    </Box>
  );
};

export default DateSelector;
