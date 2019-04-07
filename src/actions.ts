import {
  ActionCreator,
} from 'redux';

type RepositoryUpdatedAction = {
  type: 'REPOSITORY_UPDATED',
};

export const repositoryUpdated: ActionCreator<RepositoryUpdatedAction> = () => ({
  type: 'REPOSITORY_UPDATED',
});
