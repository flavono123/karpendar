import React from 'react';

// This is a simple custom component to render time grid events for debugging
const CustomTimeGridEvent = ({ calendarEvent }: { calendarEvent: any }) => {
  console.log('Rendering CustomTimeGridEvent:', calendarEvent);

  return (
    <div
      style={{
        backgroundColor: calendarEvent.color || '#0972D3',
        color: 'white',
        padding: '4px',
        fontSize: '0.8rem',
        borderRadius: '4px',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ fontWeight: 'bold' }}>{calendarEvent.title}</div>
      <div>{calendarEvent.start} - {calendarEvent.end}</div>
    </div>
  );
};

export default CustomTimeGridEvent;
