import {
  WebhookPayloadCheckSuite,
} from '@octokit/webhooks';

import {
  Context,
} from 'probot';

type WebhookPayloadCheckSuiteAuthenticated = WebhookPayloadCheckSuite & {
  installation: {
    id: number,
    node_id: string,
  },
};

export type ContextPayloadCheckSuite = Context<WebhookPayloadCheckSuite>;
export type ContextPayloadCheckSuiteAuthenticated = Context<WebhookPayloadCheckSuiteAuthenticated>;

export const isAuthenticated = (
  context: ContextPayloadCheckSuite,
): context is ContextPayloadCheckSuiteAuthenticated =>
  // @ts-ignore
  context.payload.installation !== undefined;

export const getPullsNumber = (context: ContextPayloadCheckSuiteAuthenticated) =>
  context.payload.check_suite.pull_requests.map(pull => pull.number);
