'use client';

import React, { useState } from 'react';
import {
  AppLayout,
  Button,
  Container,
  ContentLayout,
  Header,
  Link,
  SpaceBetween,
  SplitPanel,
  Tabs,
} from '@cloudscape-design/components';
import I18nProvider from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.all';

import YamlEditor from './components/YamlEditor';
import DisruptionCalendar from './components/DisruptionCalendar';
import BudgetSummary from './components/BudgetSummary';
import { NodePool } from './types/karpenter';

const LOCALE = 'en';

export default function Home() {
  const [nodePool, setNodePool] = useState<NodePool | null>(null);
  const [splitPanelOpen, setSplitPanelOpen] = useState(true);
  const [splitPanelSize, setSplitPanelSize] = useState(500);
  const [splitPanelPosition, setSplitPanelPosition] = useState<
    'side' | 'bottom'
  >('side');
  const [activeTabId, setActiveTabId] = useState('calendar');

  return (
    <div>
      <I18nProvider locale={LOCALE} messages={[messages]}>
        <AppLayout
          content={
            <ContentLayout
              header={
                <Header
                  variant="h1"
                  description="Visualize Karpenter NodePool Disruption Budgets"
                  info={
                    <Link
                      external
                      href="https://karpenter.sh/docs/concepts/disruption/#nodepool-disruption-budgets"
                      variant="primary"
                    >
                      Docs
                    </Link>
                  }
                >
                  Karpendar
                </Header>
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
              <SpaceBetween size="l">
                <Header variant="h2" description="Paste your NodePool manifest">
                  NodePool
                </Header>
                <YamlEditor onChange={setNodePool} />
              </SpaceBetween>
            </SplitPanel>
          }
          splitPanelPreferences={{
            position: splitPanelPosition,
          }}
          splitPanelOpen={splitPanelOpen}
          splitPanelSize={splitPanelSize}
          onSplitPanelToggle={() => setSplitPanelOpen(!splitPanelOpen)}
          onSplitPanelResize={({ detail }) => {
            setSplitPanelSize(detail.size);
          }}
          onSplitPanelPreferencesChange={({ detail }) => {
            setSplitPanelPosition(detail.position);
          }}
        />
      </I18nProvider>
    </div>
  );
}
