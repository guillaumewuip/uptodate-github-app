import {
  ContextPayloadPushAuthenticated,
} from './PayloadPush';

import {
  ContextPayloadCheckSuiteAuthenticated,
} from './PayloadCheckSuite';

import {
  ContextPayloadPullRequestReviewAuthenticated,
} from './PayloadPullRequestReview';

import {
  ContextPayloadPullRequestAuthenticated,
} from './PayloadPullRequest';

export type ContextWithRepositoryAuthenticated = ContextPayloadPushAuthenticated
 | ContextPayloadCheckSuiteAuthenticated
 | ContextPayloadPullRequestAuthenticated
 | ContextPayloadPullRequestReviewAuthenticated;

export const getRepositoryDefaultBranch = (
  context: ContextWithRepositoryAuthenticated,
): string => context.payload.repository.default_branch;

export const getRepositoryId = (context: ContextWithRepositoryAuthenticated) => {
  return context.payload.repository.id;
};

export const getRepositoryFullName = (context: ContextWithRepositoryAuthenticated) => {
  return context.payload.repository.full_name;
};

export const getRepositoryName = (context: ContextWithRepositoryAuthenticated) => {
  return context.payload.repository.name;
};

export const getRepositoryOwnerLogin = (context: ContextWithRepositoryAuthenticated) => {
  return context.payload.repository.owner.login;
};

export const getRepositoryIdentifier = (context: ContextWithRepositoryAuthenticated) => {
  return `${getRepositoryId(context)}-${getRepositoryFullName(context)}`;
};

export const getLogInfo = (context: ContextWithRepositoryAuthenticated) => ({
  owner: context.payload.repository.owner.login,
  repo: context.payload.repository.name,
  installationId: context.payload!.installation.id,
});
