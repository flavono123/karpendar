'use client';

import React, { useState } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import Tabs from '@cloudscape-design/components/tabs';
import Alert from '@cloudscape-design/components/alert';
import ColumnLayout from '@cloudscape-design/components/column-layout';

import YamlEditor from './components/YamlEditor';
import DateSelector from './components/DateSelector';
import DisruptionCalendar from './components/DisruptionCalendar';
import BudgetSummary from './components/BudgetSummary';
import { NodePool } from './types/karpenter';

export default function Home() {
  const [nodePool, setNodePool] = useState<NodePool | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTabId, setActiveTabId] = useState('calendar');

  return (
    <div className="karpendar-app">
      <AppLayout
        content={
          <ContentLayout
            header={
              <SpaceBetween size="m">
                <Header
                  variant="h1"
                  description="Visualize Karpenter NodePool Disruption Budgets in a human-readable format"
                >
                  Karpendar
                </Header>
              </SpaceBetween>
            }
          >
            <ColumnLayout columns={2}>
              <Container>
                <SpaceBetween size="l">
                  <Header
                    variant="h2"
                    description="Paste your NodePool YAML to visualize its disruption budgets"
                  >
                    NodePool Configuration
                  </Header>
                  <YamlEditor onChange={setNodePool} />
                </SpaceBetween>
              </Container>

              <Container>
                <SpaceBetween size="l">
                  <Header
                    variant="h2"
                    description="Select a date to see when disruptions are allowed or blocked"
                  >
                    Selected Date (UTC)
                  </Header>
                  <DateSelector
                    selectedDate={selectedDate}
                    onChange={setSelectedDate}
                  />
                </SpaceBetween>
              </Container>
            </ColumnLayout>

            <Tabs
              activeTabId={activeTabId}
              onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
              tabs={[
                {
                  id: 'calendar',
                  label: 'Calendar View',
                  content: (
                    <DisruptionCalendar
                      nodePool={nodePool}
                      selectedDate={selectedDate}
                    />
                  ),
                },
                {
                  id: 'summary',
                  label: 'Budget Summary',
                  content: (
                    <BudgetSummary
                      nodePool={nodePool}
                      selectedDate={selectedDate}
                    />
                  ),
                },
              ]}
            />
          </ContentLayout>
        }
        toolsHide
        contentType="default"
        navigationHide
      />
    </div>
  );
}
