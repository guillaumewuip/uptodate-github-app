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
  Context,
} from 'probot';

import {
  find,
} from 'ramda';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  WebhookPayloadPushAuthenticated,
} from '../entities/eventPayloads';

import {
  RecursivePartial,
} from '../types';

import {
  updatePullSaga,
} from './updatePull';

import {
  REBASE_LABEL,
  updateRepositorySaga,
} from './updateRepository';

type WebhookPayloadPushContext = Context<WebhookPayloadPushAuthenticated>;
type OctokitPullsList = WebhookPayloadPushContext['github']['pulls']['list'];
type OctokitFindRepoInstallation =
  WebhookPayloadPushContext['github']['apps']['findRepoInstallation'];

type OctokitGetInstallationToken = Application['app']['getInstallationAccessToken'];

describe('sagas/updateRepository', () => {
  const fullName = 'guillaumewuip/uptodate-github-app';
  const token = '1223412432';

  const getInstallationAccessToken = jest.fn().mockReturnValue(token);

  const mockedApp: RecursivePartial<Application> = {
    log: jest.fn() as unknown as Application['log'],
    app: {
      getInstallationAccessToken: (
        getInstallationAccessToken as unknown as OctokitGetInstallationToken
      ),
    },
  };

  const app = mockedApp as Application;

  beforeEach(() => {
    (app.log as unknown as jest.Mock).mockReset();
    (app.app.getInstallationAccessToken as unknown as jest.Mock).mockReset();
  });

  it('should call updatePullSaga for every PR to update', async () => {
    const data: RecursivePartial<PullsListResponseItem[]> = [
      {
        id: 1,
        labels: [
          {
            name: REBASE_LABEL,
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

    const findRepoInstallation = jest.fn().mockResolvedValue({
      data: {
        id: 1,
      },
    });

    const context: RecursivePartial<WebhookPayloadPushContext> = {
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
        apps: {
          findRepoInstallation: findRepoInstallation as unknown as OctokitFindRepoInstallation,
        },
      },
    };

    const {
      effects: {
        call,
      },
    } = await expectSaga(
      updateRepositorySaga,
      app,
      context as unknown as Context,
    )
      .silentRun();

    const updatePullCall = find<typeof call[0]>(
      (effect: typeof call[0]) => effect.payload.fn === updatePullSaga,
      call,
    );

    expect(updatePullCall).not.toBeUndefined();
  });

  it('should handle fetch PRs error', async () => {
    const listPulls = jest.fn().mockRejectedValue(new Error());

    const context: RecursivePartial<WebhookPayloadPushContext> = {
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

    await expectSaga(
      updateRepositorySaga,
      app,
      context as unknown as Context,
    )
      .run(false);

    expect(app.log).toHaveBeenLastCalledWith(
      `Can't fetch pull requests for ${fullName}`,
    );
  });

  it('should handle getRepositoryAccessToken error', async () => {
    const data: RecursivePartial<PullsListResponseItem[]> = [
      {
        id: 1,
        labels: [
          {
            name: REBASE_LABEL,
          },
        ],
      },
    ];

    const findRepoInstallation = jest.fn().mockRejectedValue(new Error(''));

    const listPulls = jest.fn().mockResolvedValue({
      data,
    });

    const context: RecursivePartial<WebhookPayloadPushContext> = {
      payload: {
        repository: {
          owner: {
            login: 'guillaumewuip',
          },
          name: 'uptodate-github-app',
          full_name: 'guillaumewuip/uptodate-github-app',
        },
      },
      github: {
        pulls: {
          list: listPulls as unknown as OctokitPullsList,
        },
        apps: {
          findRepoInstallation: findRepoInstallation as unknown as OctokitFindRepoInstallation,
        },
      },
    };

    await expectSaga(
      updateRepositorySaga,
      app,
      context as unknown as Context,
    )
      .provide([
        [callMatcher.fn(updatePullSaga), throwError(new Error())],
      ])
      .run(false);

    expect(app.log).toHaveBeenLastCalledWith(
      `Can't get repositoryToken for ${fullName}`,
    );
  });

  it('should handle updatePull error', async () => {
    const data: RecursivePartial<PullsListResponseItem[]> = [
      {
        id: 1,
        labels: [
          {
            name: REBASE_LABEL,
          },
        ],
      },
    ];

    const findRepoInstallation = jest.fn().mockResolvedValue({
      data: {
        id: 1,
      },
    });

    const listPulls = jest.fn().mockResolvedValue({
      data,
    });

    const context: RecursivePartial<WebhookPayloadPushContext> = {
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
        apps: {
          findRepoInstallation: findRepoInstallation as unknown as OctokitFindRepoInstallation,
        },
      },
    };

    await expectSaga(
      updateRepositorySaga,
      app,
      context as unknown as Context,
    )
      .provide([
        [callMatcher.fn(updatePullSaga), throwError(new Error())],
      ])
      .run(false);

    expect(app.log).toHaveBeenLastCalledWith(
      `Unknown error updating pull requests for ${fullName}`,
    );
  });
});
