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
  WebhookPayloadPush,
} from '@octokit/webhooks';

import {
  PullsListResponseItem,
} from '@octokit/rest';

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

type WebhookPayloadPushContext = Context<WebhookPayloadPush>;
type OctokitPullsList = WebhookPayloadPushContext['github']['pulls']['list'];

describe('sagas/updateRepository', () => {
  const fullName = 'guillaumewuip/uptodate-github-app';

  it('should call updatePullSaga for every PR to update', async () => {
    const app = {
      log: jest.fn(),
    } as unknown as Application;

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

    expect(call).toHaveLength(3); // listPulls, updatePull and all
    expect(call[1].payload.fn).toEqual(updatePullSaga);
  });

  it('should handle fetch PRs error', async () => {
    const app = {
      log: jest.fn(),
    } as unknown as Application;

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

  it('should handle updatePull error', async () => {
    const app = {
      log: jest.fn(),
    } as unknown as Application;

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
