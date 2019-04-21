import {
  Probot,
  ApplicationFunction,
} from 'probot';

import configureStore, {
  MockStore,
} from 'redux-mock-store';

import {
  Store,
} from 'redux';

import bot from './bot';

import {
  Application,
} from './entities/Application';

import {
  REPOSITORY_UPDATED,
} from './actions/updateRepository';

import {
  PULL_REQUEST_STATUS_UPDATED,
} from './actions/pullRequestStatusUpdated';

import {
  PULL_REQUEST_MERGED,
} from './actions/pullRequestMerged';

const mockStore = configureStore();

describe('bot', () => {
  let probot: Probot;
  let store: MockStore;

  beforeEach(() => {
    probot = new Probot({});
    store = mockStore();

    const appFn = bot as ApplicationFunction;
    const app = probot.load(appFn) as Application;

    // @ts-ignore
    app.githubToken = 'test-token';
    app.store = store as unknown as Store;
  });

  it('should get push event on master', async () => {
    const pushEventPayload = {
      ref: 'refs/heads/master',
      repository: {
        id: 1,
        fullName: 'guillaumewuip/test',
        default_branch: 'master',
      },
      installation: {
        id: 1,
      },
    };

    await probot.receive({
      id: '1',
      name: 'push',
      payload: pushEventPayload,
    });

    const actions = store.getActions();
    expect(actions).toHaveLength(1);

    expect(actions[0].type).toEqual(REPOSITORY_UPDATED);
  });

  it('should not get push event on another branch', async () => {
    const pushEventPayload = {
      ref: 'refs/heads/dev',
      repository: {
        id: 1,
        fullName: 'guillaumewuip/test',
        default_branch: 'master',
      },
      installation: {
        id: 1,
      },
    };

    await probot.receive({
      id: '1',
      name: 'push',
      payload: pushEventPayload,
    });

    const actions = store.getActions();
    expect(actions).toHaveLength(0);
  });

  it('should get check_suite.completed', async () => {
    const checkSuiteEventPayload = {
      repository: {
        id: 1,
        fullName: 'guillaumewuip/test',
        default_branch: 'master',
      },
      installation: {
        id: 1,
      },
      check_suite: {
        pull_requests: [
          {
            number: 1,
          },
          {
            number: 2,
          },
        ],
      },
    };

    await probot.receive({
      id: '1',
      name: 'check_suite.completed',
      payload: checkSuiteEventPayload,
    });

    const actions = store.getActions();
    expect(actions).toHaveLength(2);

    expect(actions[0].type).toEqual(PULL_REQUEST_STATUS_UPDATED);
    expect(actions[1].type).toEqual(PULL_REQUEST_STATUS_UPDATED);
  });

  it('should get pull_request_review.submitted', async () => {
    const pullRequestReviewEventPayload = {
      repository: {
        id: 1,
        fullName: 'guillaumewuip/test',
        default_branch: 'master',
      },
      installation: {
        id: 1,
      },
      pull_request: {
        number: 1,
      },
    };

    await probot.receive({
      id: '1',
      name: 'pull_request_review.submitted',
      payload: pullRequestReviewEventPayload,
    });

    const actions = store.getActions();
    expect(actions).toHaveLength(1);

    expect(actions[0].type).toEqual(PULL_REQUEST_STATUS_UPDATED);
  });

  it('should get pull_request.closed', async () => {
    const pullRequestReviewEventPayload = {
      repository: {
        id: 1,
        fullName: 'guillaumewuip/test',
        default_branch: 'master',
      },
      installation: {
        id: 1,
      },
      pull_request: {
        number: 1,
        merged: true,
      },
      action: 'closed',
    };

    await probot.receive({
      id: '1',
      name: 'pull_request.closed',
      payload: pullRequestReviewEventPayload,
    });

    const actions = store.getActions();
    expect(actions).toHaveLength(1);

    expect(actions[0].type).toEqual(PULL_REQUEST_MERGED);
  });
});
