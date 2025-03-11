import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Badge from '@cloudscape-design/components/badge';
import Alert from '@cloudscape-design/components/alert';
import { DisruptionBudget, NodePool } from '../types/karpenter';
import { describeBudget, humanReadableBudget } from '../utils/budgetHelpers';
import { describeCronSchedule } from '../utils/cronParser';

interface BudgetSummaryProps {
  nodePool: NodePool | null;
  selectedDate: Date;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ nodePool, selectedDate }) => {
  if (!nodePool) {
    return (
      <Container>
        <Alert type="info">
          Please enter a valid NodePool YAML configuration to see the budget summary.
        </Alert>
      </Container>
    );
  }

  const { budgets = [] } = nodePool.spec.disruption;

  // Find budgets with nodes=0 (blocking disruptions)
  const blockingBudgets = budgets.filter(budget => budget.nodes === '0');

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Understand how NodePool Disruption Budgets affect your cluster"
        >
          Budget Summary
        </Header>
      }
    >
      <SpaceBetween size="l">
        {blockingBudgets.length > 0 && (
          <Box>
            <Header variant="h3">
              No-Disruption Windows
              <Badge color="red">{blockingBudgets.length}</Badge>
            </Header>
            <Table
              columnDefinitions={[
                {
                  id: 'reasons',
                  header: 'Affected Reasons',
                  cell: (item: DisruptionBudget) =>
                    item.reasons?.join(', ') || 'All Reasons',
                },
                {
                  id: 'schedule',
                  header: 'Schedule (UTC)',
                  cell: (item: DisruptionBudget) =>
                    item.schedule ? describeCronSchedule(item.schedule) : 'Always',
                },
                {
                  id: 'duration',
                  header: 'Duration',
                  cell: (item: DisruptionBudget) => item.duration || 'Indefinite',
                },
                {
                  id: 'explanation',
                  header: 'Human Readable',
                  cell: (item: DisruptionBudget) => humanReadableBudget(item),
                }
              ]}
              items={blockingBudgets}
              variant="embedded"
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No blocking budgets</b>
                  <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                    There are no budgets that completely block disruptions.
                  </Box>
                </Box>
              }
            />
          </Box>
        )}

        <Box>
          <Header variant="h3">
            All Budgets
            <Badge color="blue">{budgets.length}</Badge>
          </Header>
          <Table
            columnDefinitions={[
              {
                id: 'nodes',
                header: 'Nodes',
                cell: (item: DisruptionBudget) => item.nodes,
              },
              {
                id: 'reasons',
                header: 'Reasons',
                cell: (item: DisruptionBudget) =>
                  item.reasons?.join(', ') || 'All Reasons',
              },
              {
                id: 'schedule',
                header: 'Schedule',
                cell: (item: DisruptionBudget) => item.schedule || '-',
              },
              {
                id: 'duration',
                header: 'Duration',
                cell: (item: DisruptionBudget) => item.duration || '-',
              },
              {
                id: 'description',
                header: 'Description',
                cell: (item: DisruptionBudget) => describeBudget(item),
              }
            ]}
            items={budgets}
            variant="embedded"
            empty={
              <Box textAlign="center" color="inherit">
                <b>No budgets defined</b>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  Karpenter will use the default 10% budget.
                </Box>
              </Box>
            }
          />
        </Box>

        <Alert type="info">
          Note: Schedules are interpreted in UTC time. Karpenter does not currently support timezone configuration.
        </Alert>
      </SpaceBetween>
    </Container>
  );
};

export default BudgetSummary;
