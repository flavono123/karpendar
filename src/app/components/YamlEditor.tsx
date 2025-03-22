import React, { useState, useEffect } from 'react';
import CodeEditor from '@cloudscape-design/components/code-editor';
import Box from '@cloudscape-design/components/box';
import { parseYaml } from '../utils/yamlParser';
import { NodePool } from '../types/karpenter';
import { aceLoader } from './ace';

interface YamlEditorProps {
  onChange: (nodePool: NodePool | null) => void;
  initialValue: string;
  onYamlChange?: (yaml: string) => void;
}

const YamlEditor: React.FC<YamlEditorProps> = ({
  onChange,
  initialValue,
  onYamlChange,
}) => {
  const [yaml, setYaml] = useState(initialValue);
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

  // Update yaml if initialValue changes and is different from current yaml
  useEffect(() => {
    if (initialValue !== yaml) {
      setYaml(initialValue);
    }
  }, [initialValue]);

  // Parse the YAML whenever it changes
  useEffect(() => {
    try {
      const nodePool = parseYaml(yaml);
      onChange(nodePool);
      if (onYamlChange) {
        onYamlChange(yaml);
      }
    } catch (err) {
      onChange(null);
    }
  }, [yaml, onChange, onYamlChange]);

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
        themes={{ light: ['cloud_editor'], dark: ['cloud_editor_dark'] }}
      />
    </Box>
  );
};

export default YamlEditor;
