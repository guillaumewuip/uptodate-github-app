import {
  PayloadRepository,
} from '@octokit/webhooks';

import {
  Context,
} from 'probot';

export const REPOSITORY_UPDATED = 'REPOSITORY_UPDATED';

export type RepositoryUpdatedAction = {
  type: typeof REPOSITORY_UPDATED,
  context: Context,
  payload: {
    repository: PayloadRepository,
  },
};

export const repositoryUpdated = (
  repository: PayloadRepository,
  context: Context,
): RepositoryUpdatedAction => ({
  context,
  type: 'REPOSITORY_UPDATED',
  payload: {
    repository,
  },
});
