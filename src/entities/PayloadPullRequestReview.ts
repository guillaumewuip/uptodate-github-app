import {
  WebhookPayloadPullRequestReview,
} from '@octokit/webhooks';

import {
  Context,
} from 'probot';

type WebhookPayloadPullRequestReviewAuthenticated = WebhookPayloadPullRequestReview & {
  installation: {
    id: number,
    node_id: string,
  },
};

export type ContextPayloadPullRequestReview = Context<WebhookPayloadPullRequestReview>;
export type ContextPayloadPullRequestReviewAuthenticated =
  Context<WebhookPayloadPullRequestReviewAuthenticated>;

export const isAuthenticated = (
  context: ContextPayloadPullRequestReview,
): context is ContextPayloadPullRequestReviewAuthenticated =>
  // @ts-ignore
  context.payload.installation !== undefined;

export const getPullNumber = (context: ContextPayloadPullRequestReviewAuthenticated) =>
  context.payload.pull_request.number;
