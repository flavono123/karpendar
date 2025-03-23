import {
  CalendarAppSingleton,
  definePlugin,
  toDateString,
} from '@schedule-x/shared';
import React from 'react';
import { createRoot } from 'react-dom/client';
import DateTimeModal from '../components/DateTimeModal';
import * as awsui from '@cloudscape-design/design-tokens/index.js';
import { DisruptionBudget } from '../types/karpenter';

class DateTimeIndicatorWithCloudscapeModalPluginImpl {
  name = 'datetimeIndicatorWithCloudscapeModal';
  $app!: CalendarAppSingleton;
  private datetime: Date | null = null;
  private isModalOpen: boolean = false;
  private modalRoot: any = null;
  private modalContainer: HTMLDivElement | null = null;
  private indicatorElement: HTMLDivElement | null = null;
  private budgets: DisruptionBudget[] = [];
  private calendarElement: HTMLElement | null = null;

  onRender($app: CalendarAppSingleton): void {
    this.$app = $app;
    if (this.datetime) {
      this.setIndicator();
    }

    // Create a container for the modal if it doesn't exist
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.id = 'sx-datetime-cloudscape-modal-container';
      document.body.appendChild(this.modalContainer);
      this.modalRoot = createRoot(this.modalContainer);
    }
  }

  public setDatetime(date: Date) {
    this.datetime = date;
    this.setIndicator();
    this.renderModal();
  }

  public setBudgets(budgets: DisruptionBudget[]) {
    this.budgets = budgets;
  }

  public setCalendarElement(element: HTMLElement) {
    this.calendarElement = element;
  }

  public toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    this.renderModal();
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
    this.indicatorElement = indicatorEl;

    // Calculate position (60*h + m(datetime in minute)/1440(a day in minute) * 100)
    const hour = this.datetime.getHours();
    const minute = this.datetime.getMinutes();
    const top = (60 * hour + minute) / 1440;
    indicatorEl.style.top = `${top * 100}%`;

    // Style the indicator
    indicatorEl.style.position = 'absolute';
    indicatorEl.style.height = '2px';
    indicatorEl.style.width = '100%';
    indicatorEl.style.backgroundColor = awsui.colorChartsPaletteCategorical5;
    indicatorEl.style.cursor = 'pointer';

    dateCell.appendChild(indicatorEl);
    this.isModalOpen = true;
  }

  // Helper method to get the indicator element for the modal
  private getIndicatorElement = () => {
    return this.indicatorElement;
  };

  private renderModal() {
    if (!this.modalRoot || !this.datetime) return;

    let position = null;
    if (this.indicatorElement) {
      const rect = this.indicatorElement.getBoundingClientRect();
      position = {
        top: rect.top,
        left: rect.right, // Position to the right of the indicator
      };
    }

    this.modalRoot.render(
      <DateTimeModal
        datetime={this.datetime}
        position={position}
        isOpen={this.isModalOpen}
        onClose={() => {
          this.isModalOpen = false;
          this.renderModal();
        }}
        getIndicatorElement={this.getIndicatorElement}
        budgets={this.budgets}
      />
    );
  }

  destroy(): void {
    const calendarWrapper = this.$app.elements.calendarWrapper;
    if (calendarWrapper) {
      const existingIndicators = calendarWrapper.querySelectorAll(
        '.sx__datetime-indicator'
      );
      existingIndicators.forEach(indicator => indicator.remove());
    }

    // Clean up the React root and container
    if (this.modalRoot) {
      this.modalRoot.unmount();
    }
    if (this.modalContainer && this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
    }
    this.modalContainer = null;
    this.modalRoot = null;
  }
}

export const createDateTimeIndicatorWithCloudscapeModalPlugin = () => {
  return definePlugin(
    'datetimeIndicatorWithCloudscapeModal',
    new DateTimeIndicatorWithCloudscapeModalPluginImpl()
  );
};
