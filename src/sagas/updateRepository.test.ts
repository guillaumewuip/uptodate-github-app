import {
  expectSaga,
} from 'redux-saga-test-plan';

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
  REBASE_LABEL,
  updateRepositorySaga,
} from './updateRepository';

type WebhookPayloadPushContext = Context<WebhookPayloadPush>;
type OctokitPullsList = WebhookPayloadPushContext['github']['pulls']['list'];

describe('sagas/updateRepository', () => {
  it('should', async () => {
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

    await expectSaga(
      updateRepositorySaga,
      app,
      context as unknown as Context,
    )
      .silentRun();

    // TODO test workflow
  });
});
