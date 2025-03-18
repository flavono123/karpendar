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
import { ColumnLayout, SplitPanel } from '@cloudscape-design/components';
import I18nProvider from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.all';

export default function Home() {
  const [nodePool, setNodePool] = useState<NodePool | null>(null);
  const [activeTabId, setActiveTabId] = useState('calendar');
  const LOCALE = 'en';

  return (
    <div>
      <I18nProvider locale={LOCALE} messages={[messages]}>
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
              <Tabs
                activeTabId={activeTabId}
                onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
                tabs={[
                  {
                    id: 'calendar',
                    label: 'Calendar View',
                    content: (
                      <DisruptionCalendar
                        budgets={nodePool?.spec?.disruption?.budgets || []}
                      />
                    ),
                  },
                  {
                    id: 'summary',
                    label: 'Budget Summary',
                    content: <BudgetSummary nodePool={nodePool} />,
                  },
                ]}
              />
            </ContentLayout>
          }
          toolsHide
          contentType="default"
          navigationHide
          splitPanel={
            <SplitPanel header="Configuration">
              <ColumnLayout>
                <Container>
                  <SpaceBetween size="l">
                    <Header
                      variant="h2"
                      description="Paste your NodePool YAML to visualize its disruption budgets"
                    >
                      NodePool
                    </Header>
                    <YamlEditor onChange={setNodePool} />
                  </SpaceBetween>
                </Container>
              </ColumnLayout>
            </SplitPanel>
          }
        />
      </I18nProvider>
    </div>
  );
}
