import{
  createMockTask,
} from '@redux-saga/testing-utils';

import {
  REPOSITORY_UPDATED,
  repositoryUpdated,
} from '../actions/updateRepository';

import {
  ContextPayloadPushAuthenticated,
  getRepositoryIdentifier,
} from '../entities/PayloadPush';

import {
  testSaga,
} from 'redux-saga-test-plan';

import {
  updateRepositorySaga,
} from './updateRepository';
import {
  RepositoryUpdateTasks,
  handleRepositoryUpdate,
  updateRepositoriesSaga,
} from './updateRepositories';

describe('sagas/updateRepositories', () => {
  const context1 = {
    log: {
      info: jest.fn(),
    } as unknown as ContextPayloadPushAuthenticated['log'],
    payload: {
      repository: {
        id: '1',
        owner: {
          login: 'guillaumewuip',
        },
        name: 'test',
      },
      installation: {
        id: 1,
      },
    },
  } as unknown as ContextPayloadPushAuthenticated;

  const context2 = {
    log: {
      info: jest.fn(),
    } as unknown as ContextPayloadPushAuthenticated['log'],
    payload: {
      repository: {
        id: '2',
        owner: {
          login: 'guillaumewuip',
        },
        name: 'test2',
      },
      installation: {
        id: 1,
      },
    },
  } as unknown as ContextPayloadPushAuthenticated;

  const repository1UpdatedAction = repositoryUpdated(
    context1,
  );

  const repository1Id = getRepositoryIdentifier(context1);
  const repository2Id = getRepositoryIdentifier(context2);

  describe('updateRepositoriesSaga', () => {
    it('should takeEvery REPOSITORY_UPDATED with handleRepositoryUpdate', async () => {
      await testSaga(
        updateRepositoriesSaga,
      )
        .next()
        .takeEvery(
          REPOSITORY_UPDATED,
          handleRepositoryUpdate,
          {},
        )

        .next()
        .isDone();
    });
  });

  describe('handleRepositoryUpdate', () => {
    it('should fork updateRepository for  saga', async () => {
      const tasks: RepositoryUpdateTasks = {};
      const repository1Task = createMockTask();

      await testSaga(
        handleRepositoryUpdate,
        tasks,
        repository1UpdatedAction,
      )
        .next()
        .fork(
          updateRepositorySaga,
          context1,
        )

        .next(repository1Task)
        .isDone();

      expect(tasks[repository1Id]).toEqual(repository1Task);
    });

    it('should cancel remaining update task for repository first', async () => {
      const repository1Task1 = createMockTask();
      const repository1Task2 = createMockTask();

      const repository2Task1 = createMockTask();

      const tasks: RepositoryUpdateTasks = {
        [repository1Id]: repository1Task1,
        [repository2Id]: repository2Task1,
      };

      await testSaga(
        handleRepositoryUpdate,
        tasks,
        repository1UpdatedAction,
      )
        .next()
        .cancel(repository1Task1)

        .next()
        .fork(
          updateRepositorySaga,
          context1,
        )

        .next(repository1Task2)
        .isDone();

      expect(tasks).toEqual({
        [repository1Id]: repository1Task2,
        [repository2Id]: repository2Task1,
      });
    });
  });
});
