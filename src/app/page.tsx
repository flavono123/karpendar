'use client';

import React, { useState } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import Tabs from '@cloudscape-design/components/tabs';
import YamlEditor from './components/YamlEditor';
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
