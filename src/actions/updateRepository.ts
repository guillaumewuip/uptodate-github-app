import {
  ContextPayloadPushAuthenticated,
} from '../entities/eventPayloads';

export const REPOSITORY_UPDATED = 'REPOSITORY_UPDATED';

export type RepositoryUpdatedAction = {
  type: typeof REPOSITORY_UPDATED,
  context: ContextPayloadPushAuthenticated,
};

export const repositoryUpdated = (
  context: ContextPayloadPushAuthenticated,
): RepositoryUpdatedAction => ({
  context,
  type: 'REPOSITORY_UPDATED',
});
