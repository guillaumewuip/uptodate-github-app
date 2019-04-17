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

export const defaultBranch = (context: ContextPayloadPushAuthenticated): string =>
  context.payload.repository.default_branch;

export const isDefaultBranchUpdated = (context: ContextPayloadPushAuthenticated): boolean => {
  const branch = branchUpdated(context);

  return equals(branch, defaultBranch(context));
};

export const getRepositoryId = (context: ContextPayloadPushAuthenticated) => {
  return context.payload.repository.id;
};

export const getRepositoryFullName = (context: ContextPayloadPushAuthenticated) => {
  return context.payload.repository.full_name;
};

export const getRepositoryName = (context: ContextPayloadPushAuthenticated) => {
  return context.payload.repository.name;
};

export const getRepositoryOwnerLogin = (context: ContextPayloadPushAuthenticated) => {
  return context.payload.repository.owner.login;
};

export const getRepositoryIdentifier = (context: ContextPayloadPushAuthenticated) => {
  return `${getRepositoryId(context)}-${getRepositoryFullName(context)}`;
};

export const getInstallationId = (context: ContextPayloadPushAuthenticated) => {
  return context.payload.installation.id;
};
