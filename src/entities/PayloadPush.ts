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

import {
  getRepositoryDefaultBranch,
} from './withRepositoryAuthenticated';

type WebhookPayloadPushAuthenticated = WebhookPayloadPush & {
  installation: {
    id: number,
    node_id: string,
  },
};

export type ContextPayloadPush = Context<WebhookPayloadPush>;
export type ContextPayloadPushAuthenticated = Context<WebhookPayloadPushAuthenticated>;

export const isAuthenticated = (
  context: ContextPayloadPush,
): context is ContextPayloadPushAuthenticated =>
  // @ts-ignore
  context.payload.installation !== undefined;

const branchUpdated = (context: ContextPayloadPushAuthenticated): string => {
  const ref = context.payload.ref;
  const parts = ref.split('/');

  const branch = last(parts) as string;

  return branch;
};

export const isDefaultBranchUpdated = (context: ContextPayloadPushAuthenticated): boolean => {
  const branch = branchUpdated(context);

  return equals(branch, getRepositoryDefaultBranch(context));
};
