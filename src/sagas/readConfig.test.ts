import {
  expectSaga,
} from 'redux-saga-test-plan';

import {
  Context,
} from 'probot';

import {
  Application,
} from '../entities/Application';

import {
  WebhookPayloadPushAuthenticated,
} from '../entities/eventPayloads';

import {
  defaultConfig,
} from '../entities/config';

import {
  RecursivePartial,
} from '../types';

import {
  readRepoConfigSaga,
} from './readConfig';

type WebhookPayloadPushContext = Context<WebhookPayloadPushAuthenticated>;

describe('sagas/readRepoConfig', () => {
  it('should return the repo config', async () => {
    const app = {
      log: jest.fn(),
    } as unknown as Application;

    const config = {
      test: 'test',
    };

    const mockedContext: RecursivePartial<WebhookPayloadPushContext> = {
      config: jest.fn().mockResolvedValue(config) as unknown as WebhookPayloadPushContext['config'],
    };
    const context = mockedContext as unknown as Context<WebhookPayloadPushAuthenticated>;

    await expectSaga(
      readRepoConfigSaga,
      app,
      context,
    )
      .returns(config)
      .run(false);
  });

  it('should return the default config and log if error', async () => {
    const app = {
      log: jest.fn(),
    } as unknown as Application;

    const mockedContext: RecursivePartial<WebhookPayloadPushContext> = {
      payload: {
        repository: {
          full_name: 'owner/repo',
        },
      },
      config: jest.fn()
        .mockRejectedValue(new Error('')) as unknown as WebhookPayloadPushContext['config'],
    };
    const context = mockedContext as unknown as Context<WebhookPayloadPushAuthenticated>;

    await expectSaga(
      readRepoConfigSaga,
      app,
      context,
    )
      .returns(defaultConfig)
      .run(false);

    expect(app.log).toHaveBeenCalledWith(
      `Can't get config for ${context.payload.repository.full_name}`,
    );
  });
});
