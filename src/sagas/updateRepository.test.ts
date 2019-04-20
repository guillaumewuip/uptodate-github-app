import {
  expectSaga,
} from 'redux-saga-test-plan';

import {
  call as callMatcher,
} from 'redux-saga-test-plan/matchers';

import {
  throwError,
} from 'redux-saga-test-plan/providers';

import {
  Application,
} from 'probot';

import {
  find,
} from 'ramda';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  ContextPayloadPushAuthenticated,
  getLogInfo,
} from '../entities/eventPayloads';

import {
  Config,
  defaultConfig,
} from '../entities/config';

import {
  RecursivePartial,
} from '../types';

import {
  updatePullSaga,
} from './updatePull';

import {
  updateRepositorySaga,
} from './updateRepository';

import {
  readRepoConfigSaga,
} from './readConfig';

type OctokitPullsList = ContextPayloadPushAuthenticated['github']['pulls']['list'];
type OctokitFindRepoInstallation =
  ContextPayloadPushAuthenticated['github']['apps']['findRepoInstallation'];

describe('sagas/updateRepository', () => {
  const fullName = 'guillaumewuip/uptodate-github-app';

  it('should call updatePullSaga for every PR to update', async () => {
    const data: RecursivePartial<PullsListResponseItem[]> = [
      {
        id: 1,
        labels: [
          {
            name: defaultConfig.keepUpdatedLabel,
          },
        ],
      },
      {
        id: 2,
        labels: [
          {
            name: 'toto',
          },
        ],
      },
    ];

    const listPulls = jest.fn().mockResolvedValue({
      data,
    });

    const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPushAuthenticated['log'],
      payload: {
        repository: {
          owner: {
            login: 'guillaumewuip',
          },
          name: 'uptodate-github-app',
          full_name: 'guillaumewuip/uptodate-github-app',
        },
        installation: {
          id: 1,
        },
      },
      github: {
        pulls: {
          list: listPulls as unknown as OctokitPullsList,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

    const {
      effects: {
        call,
      },
    } = await expectSaga(
      updateRepositorySaga,
      context,
    )
      .run(false);

    const updatePullCall = find<typeof call[0]>(
      (effect: typeof call[0]) => effect.payload.fn === updatePullSaga,
      call,
    );

    expect(updatePullCall).not.toBeUndefined();
  });

  it('should call updatePullSaga for every PR to update with custom label', async () => {
    const label = 'my-custom-label';

    const data: RecursivePartial<PullsListResponseItem[]> = [
      {
        id: 1,
        labels: [
          {
            name: label,
          },
        ],
      },
      {
        id: 2,
        labels: [
          {
            name: 'toto',
          },
        ],
      },
    ];

    const listPulls = jest.fn().mockResolvedValue({
      data,
    });

    const config: Config = {
      keepUpdatedLabel: label,
      updateMethod: 'rebase',
    };

    const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPushAuthenticated['log'],
      config: jest.fn().mockResolvedValue(config),
      payload: {
        repository: {
          owner: {
            login: 'guillaumewuip',
          },
          name: 'uptodate-github-app',
          full_name: 'guillaumewuip/uptodate-github-app',
        },
        installation: {
          id: 1,
        },
      },
      github: {
        pulls: {
          list: listPulls as unknown as OctokitPullsList,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

    const {
      effects: {
        call,
      },
    } = await expectSaga(
      updateRepositorySaga,
      context,
    )
      .run(false);

    const updatePullCall = find<typeof call[0]>(
      (effect: typeof call[0]) => effect.payload.fn === updatePullSaga,
      call,
    );

    expect(updatePullCall).not.toBeUndefined();
  });

  it('should handle fetch PRs error', async () => {
    const listPullsError = new Error();
    const listPulls = jest.fn().mockRejectedValue(listPullsError);

    const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPushAuthenticated['log'],
      payload: {
        repository: {
          owner: {
            login: 'guillaumewuip',
          },
          name: 'uptodate-github-app',
          full_name: fullName,
        },
        installation: {
          id: 1,
        },
      },
      github: {
        pulls: {
          list: listPulls as unknown as OctokitPullsList,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

    await expectSaga(
      updateRepositorySaga,
      context,
    )
      .run(false);

    expect(context.log.error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        err: listPullsError,
      },
      'Can\'t fetch pull requests',
    );
  });

  it('should handle updatePull error', async () => {
    const data: RecursivePartial<PullsListResponseItem[]> = [
      {
        id: 1,
        labels: [
          {
            name: defaultConfig.keepUpdatedLabel,
          },
        ],
      },
    ];

    const listPulls = jest.fn().mockResolvedValue({
      data,
    });

    const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPushAuthenticated['log'],
      payload: {
        repository: {
          owner: {
            login: 'guillaumewuip',
          },
          name: 'uptodate-github-app',
          full_name: 'guillaumewuip/uptodate-github-app',
        },
        installation: {
          id: 1,
        },
      },
      github: {
        pulls: {
          list: listPulls as unknown as OctokitPullsList,
        },
      },
    };

    const updatePullSagaError = new Error();

    const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

    await expectSaga(
      updateRepositorySaga,
      context,
    )
      .provide([
        [callMatcher.fn(updatePullSaga), throwError(updatePullSagaError)],
      ])
      .run(false);

    expect(context.log.error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        err: updatePullSagaError,
      },
      'Unknown error updating pull requests',
    );
  });
});
