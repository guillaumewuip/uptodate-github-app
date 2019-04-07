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

const branchUpdated = (context: Context<WebhookPayloadPush>): string => {
  const ref = context.payload.ref;
  const parts = ref.split('/');

  const branch = last(parts) as string;

  return branch;
};

export const isDefaultBranchUpdated = (context: Context<WebhookPayloadPush>): boolean => {
  const branch = branchUpdated(context);
  const defaultBranch = context.payload.repository.default_branch;

  return equals(branch, defaultBranch);
};
