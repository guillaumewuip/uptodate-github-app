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
    };

    await probot.receive({
      id: '1',
      name: 'push',
      payload: pushEventPayload,
    });

    const actions = store.getActions();
    expect(actions).toHaveLength(0);
  });
});
