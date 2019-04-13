import {
  Task,
  SagaIterator,
} from 'redux-saga';

import {
  fork,
  cancel,
  takeEvery,
} from 'redux-saga/effects';

import {
  Application,
} from '../entities/Application';

import {
  REPOSITORY_UPDATED,
  RepositoryUpdatedAction,
} from '../actions/updateRepository';

import {
  getRepositoryIdentifier,
} from '../helpers';

import {
  updateRepositorySaga,
} from './updateRepository';

export type RepositoryUpdateTasks = {
  [repositoryIdentifier: string]: Task | undefined,
};

export function* handleRepositoryUpdate(
  app: Application,
  repositoriesUpdateTasks: RepositoryUpdateTasks,
  action: RepositoryUpdatedAction,
): SagaIterator {
  const {
    context,
    payload: {
      repository,
    },
  } = action;

  const repositoryIdentifier = getRepositoryIdentifier(repository);
  app.log(`Received ${repositoryIdentifier} update`);

  const repositoryTask = repositoriesUpdateTasks[repositoryIdentifier];

  if (repositoryTask) {
    if (repositoryTask.isRunning()) {
      app.log(`Cancelling ${repositoryIdentifier} running update task`);
    }

    yield cancel(repositoryTask);
  }

  repositoriesUpdateTasks[repositoryIdentifier] = yield fork(
    updateRepositorySaga,
    app,
    context,
  );
}

export function* updateRepositoriesSaga(app: Application): SagaIterator {
  const repositoriesUpdateTasks: RepositoryUpdateTasks = {};

  yield takeEvery(
    REPOSITORY_UPDATED,
    handleRepositoryUpdate,
    app,
    repositoriesUpdateTasks,
  );
}
