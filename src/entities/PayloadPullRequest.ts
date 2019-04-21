import {
  WebhookPayloadPullRequest,
} from '@octokit/webhooks';

import {
  Context,
} from 'probot';

type WebhookPayloadPullRequestAuthenticated = WebhookPayloadPullRequest & {
  installation: {
    id: number,
    node_id: string,
  },
};

export type ContextPayloadPullRequest = Context<WebhookPayloadPullRequest>;
export type ContextPayloadPullRequestAuthenticated =
  Context<WebhookPayloadPullRequestAuthenticated>;

export const isAuthenticated = (
  context: ContextPayloadPullRequest,
): context is ContextPayloadPullRequestAuthenticated =>
  // @ts-ignore
  context.payload.installation !== undefined;

export const isMerged = (context: ContextPayloadPullRequestAuthenticated) => (
  context.payload.action === 'closed'
  && context.payload.pull_request.merged === true
);

export const getBranchRef = (context: ContextPayloadPullRequestAuthenticated) =>
  context.payload.pull_request.head.ref;
