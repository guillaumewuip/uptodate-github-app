import {
  WebhookPayloadPush,
} from '@octokit/webhooks';

import {
  Context,
} from 'probot';

import {
  last,
  equals,
} from 'ramda';

export type WebhookPayloadPushAuthenticated = WebhookPayloadPush & {
  installation: {
    id: number,
    node_id: string,
  },
};

export const isAuthenticated = (
  context: Context<WebhookPayloadPush>,
): context is Context<WebhookPayloadPushAuthenticated> =>
  // @ts-ignore
  context.payload.installation !== undefined;

const branchUpdated = (context: Context<WebhookPayloadPush>): string => {
  const ref = context.payload.ref;
  const parts = ref.split('/');

  const branch = last(parts) as string;

  return branch;
};

export const defaultBranch = (context: Context<WebhookPayloadPush>): string =>
  context.payload.repository.default_branch;

export const isDefaultBranchUpdated = (context: Context<WebhookPayloadPush>): boolean => {
  const branch = branchUpdated(context);

  return equals(branch, defaultBranch(context));
};
