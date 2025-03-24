'use client';

import React, { useEffect, useState } from 'react';
import {
  AppLayout,
  ContentLayout,
  Header,
  Link,
  SpaceBetween,
  SplitPanel,
} from '@cloudscape-design/components';
import I18nProvider from '@cloudscape-design/components/i18n';
import messages from '@cloudscape-design/components/i18n/messages/all.all';

import YamlEditor from './components/YamlEditor';
import DisruptionCalendar from './components/DisruptionCalendar';
import { NodePool } from './types/karpenter';
import NodePoolAlert from './components/NodePoolAlert';

const LOCALE = 'en';

const DEFAULT_YAML = `apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets:
      - duration: 4h
        nodes: "0"
        schedule: 0 15 * * mon-fri
        reasons:
          - drifted
      - nodes: "1"
      - duration: 3h
        nodes: 30%
        schedule: 0 17 * * *
        reasons:
          - empty
      - duration: 3h
        nodes: "15%"
        schedule: 0 22 * * *
        reasons:
          - underutilized
`;

export default function Home() {
  const [nodePool, setNodePool] = useState<NodePool | null>(null);
  const [yamlContent, setYamlContent] = useState<string>(DEFAULT_YAML);
  const [splitPanelOpen, setSplitPanelOpen] = useState(true);
  const [splitPanelSize, setSplitPanelSize] = useState(630);
  const [splitPanelPosition, setSplitPanelPosition] = useState<
    'side' | 'bottom'
  >('side');

  const [notification, setNotification] = useState<{
    visible: boolean;
    reason: string;
    guide: string;
    type: 'info' | 'error' | 'warning';
  }>({
    visible: false,
    reason: '',
    guide: '',
    type: 'info',
  });

  useEffect(() => {
    if (!nodePool || !nodePool.spec?.disruption?.budgets) {
      setNotification({
        visible: true,
        reason: 'Invalid NodePool configuration',
        guide: 'Please enter a valid NodePool YAML configuration.',
        type: 'error',
      });
    } else if (
      nodePool.spec.disruption.budgets.some(budget => !budget?.nodes)
    ) {
      setNotification({
        visible: true,
        reason: 'Some budgets has no nodes defined.',
        guide: 'Please enter valid budgets including the `nodes` field.',
        type: 'warning',
      });
    } else {
      setNotification({
        visible: false,
        reason: '',
        guide: '',
        type: 'info',
      });
    }
  }, [nodePool]);

  const handleEditConfiguration = () => {
    if (!splitPanelOpen) {
      setSplitPanelOpen(true);
    }
  };

  return (
    <div>
      <I18nProvider locale={LOCALE} messages={[messages]}>
        <AppLayout
          notifications={
            notification.visible && (
              <NodePoolAlert
                header="Invalid NodePool configuration"
                reason={notification.reason}
                guide={notification.guide}
                type={notification.type}
                actionText="Edit configuration"
                onAction={handleEditConfiguration}
              />
            )
          }
          content={
            <ContentLayout
              header={
                <Header
                  variant="h1"
                  description="A calendar view of Karpenter NodePool Disruption Budgets"
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
              <DisruptionCalendar
                budgets={nodePool?.spec?.disruption?.budgets || []}
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
                <YamlEditor
                  onChange={setNodePool}
                  initialValue={yamlContent}
                  onYamlChange={setYamlContent}
                />
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
