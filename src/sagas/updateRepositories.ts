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
  REPOSITORY_UPDATED,
  RepositoryUpdatedAction,
} from '../actions/updateRepository';

import {
  getRepositoryIdentifier,
  getLogInfo,
} from '../entities/PayloadPush';

import {
  updateRepositorySaga,
} from './updateRepository';

export type RepositoryUpdateTasks = {
  [repositoryIdentifier: string]: Task | undefined,
};

export function* handleRepositoryUpdate(
  repositoriesUpdateTasks: RepositoryUpdateTasks,
  action: RepositoryUpdatedAction,
): SagaIterator {
  const {
    context,
  } = action;

  const repositoryIdentifier = getRepositoryIdentifier(context);
  context.log.info(
    getLogInfo(context),
    'Received repository update',
  );

  const repositoryTask = repositoriesUpdateTasks[repositoryIdentifier];

  if (repositoryTask) {
    if (repositoryTask.isRunning()) {
      context.log.info(
        getLogInfo(context),
        'Cancelling running update task',
      );
    }

    yield cancel(repositoryTask);
  }

  repositoriesUpdateTasks[repositoryIdentifier] = yield fork(
    updateRepositorySaga,
    context,
  );
}

export function* updateRepositoriesSaga(): SagaIterator {
  const repositoriesUpdateTasks: RepositoryUpdateTasks = {};

  yield takeEvery(
    REPOSITORY_UPDATED,
    handleRepositoryUpdate,
    repositoriesUpdateTasks,
  );
}
