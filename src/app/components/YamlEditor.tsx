import React, { useState, useEffect } from 'react';
import CodeEditor from '@cloudscape-design/components/code-editor';
import Box from '@cloudscape-design/components/box';
import { parseYaml } from '../utils/yamlParser';
import { NodePool } from '../types/karpenter';
import { aceLoader } from './ace';

const DEFAULT_YAML = `apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets:
    - nodes: "20%"
      reasons:
      - "Empty"
      - "Drifted"
    - nodes: "5"
    - nodes: "0"
      schedule: "@daily"
      duration: 10m
      reasons:
      - "Underutilized"
`;

const i18nStrings = {
  loadingState: 'Loading code editor',
  errorState: 'There was an error loading the code editor.',
  errorStateRecovery: 'Retry',
  editorGroupAriaLabel: 'Code editor',
  statusBarGroupAriaLabel: 'Status bar',
  cursorPosition: (row: number, column: number) => `Ln ${row}, Col ${column}`,
  errorsTab: 'Errors',
  warningsTab: 'Warnings',
  preferencesButtonAriaLabel: 'Preferences',
  paneCloseButtonAriaLabel: 'Close',
  preferencesModalHeader: 'Preferences',
  preferencesModalCancel: 'Cancel',
  preferencesModalConfirm: 'Confirm',
  preferencesModalWrapLines: 'Wrap lines',
  preferencesModalTheme: 'Theme',
  preferencesModalLightThemes: 'Light themes',
  preferencesModalDarkThemes: 'Dark themes',
};

interface YamlEditorProps {
  onChange: (nodePool: NodePool | null) => void;
}

const YamlEditor: React.FC<YamlEditorProps> = ({ onChange }) => {
  const [yaml, setYaml] = useState(DEFAULT_YAML);
  const [preferences, setPreferences] = useState<any>({
    theme: 'cloud_editor',
  });
  const [loading, setLoading] = useState(true);
  const [ace, setAce] = useState<any>();

  // Load Ace editor
  useEffect(() => {
    aceLoader()
      .then(ace => {
        setAce(ace);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Parse the YAML whenever it changes
  useEffect(() => {
    try {
      const nodePool = parseYaml(yaml);
      onChange(nodePool);
    } catch (err) {
      onChange(null);
    }
  }, [yaml, onChange]);

  return (
    <Box padding="m">
      <CodeEditor
        ace={ace}
        value={yaml}
        language="yaml"
        onDelayedChange={({ detail }) => setYaml(detail.value)}
        preferences={preferences}
        onPreferencesChange={({ detail }) => setPreferences(detail)}
        loading={loading}
        i18nStrings={i18nStrings}
        themes={{ light: ['cloud_editor'], dark: ['cloud_editor_dark'] }}
      />
    </Box>
  );
};

export default YamlEditor;
