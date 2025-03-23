import { Alert, Button } from '@cloudscape-design/components';
import React from 'react';

interface NodePoolAlertProps {
  header: string;
  reason: string;
  guide: string;
  type: 'info' | 'error' | 'warning';
  actionText?: string;
  onAction?: () => void;
}

const NodePoolAlert: React.FC<NodePoolAlertProps> = ({
  header,
  reason,
  guide,
  type,
  actionText,
  onAction,
}) => {
  return (
    <Alert
      header={header}
      type={type}
      action={
        <Button variant="normal" onClick={onAction}>
          {actionText}
        </Button>
      }
    >
      <p>{`${reason} ${guide}`}</p>
    </Alert>
  );
};

export default NodePoolAlert;
