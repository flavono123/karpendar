import {
  CalendarAppSingleton,
  definePlugin,
  toDateString,
  CalendarEventInternal,
} from '@schedule-x/shared';

class DateTimeIndicatorPluginImpl {
  name = 'datetimeIndicator';
  $app!: CalendarAppSingleton;
  private datetime: Date | null = null;

  onRender($app: CalendarAppSingleton): void {
    this.$app = $app;
    if (this.datetime) {
      this.setIndicator();
    }
  }

  public setDatetime(date: Date) {
    this.datetime = date;
    this.setIndicator();
  }

  private setIndicator() {
    if (!this.datetime) return;

    const calendarWrapper = this.$app.elements.calendarWrapper;
    if (!calendarWrapper) return;

    // remove existing indicators
    const existingIndicators = calendarWrapper.querySelectorAll(
      '.sx__datetime-indicator'
    );
    existingIndicators.forEach(indicator => indicator.remove());

    // select the date cell for datetime
    const dateStr = toDateString(this.datetime);
    const dateCell = calendarWrapper.querySelector(
      `[data-time-grid-date="${dateStr}"]`
    );
    if (!dateCell) return;

    // create an indicator
    const indicatorEl = document.createElement('div');
    indicatorEl.classList.add('sx__datetime-indicator');
    // 60*h + m(datetime in minute)/1440(a day in minute) * 100
    const hour = this.datetime.getHours();
    const minute = this.datetime.getMinutes();
    const top = (60 * hour + minute) / 1440;
    indicatorEl.style.top = `${top * 100}%`;

    // ref. current-time
    indicatorEl.style.position = 'absolute';
    indicatorEl.style.height = '2px';
    indicatorEl.style.width = '100%';
    indicatorEl.style.backgroundColor = 'red';

    dateCell.appendChild(indicatorEl);
  }

  destroy(): void {
    const calendarWrapper = this.$app.elements.calendarWrapper;
    if (calendarWrapper) {
      const existingIndicators = calendarWrapper.querySelectorAll(
        '.sx__datetime-indicator'
      );
      existingIndicators.forEach(indicator => indicator.remove());
    }
  }
}

export const createDateTimeIndicatorPlugin = () => {
  return definePlugin('datetimeIndicator', new DateTimeIndicatorPluginImpl());
};
