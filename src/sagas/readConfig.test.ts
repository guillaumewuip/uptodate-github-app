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
  ContextPayloadPushAuthenticated,
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

describe('sagas/readRepoConfig', () => {
  it('should return the repo config', async () => {
    const app = {
      log: jest.fn(),
    } as unknown as Application;

    const config = {
      test: 'test',
    };

    const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
      config: jest.fn()
        .mockResolvedValue(config) as unknown as ContextPayloadPushAuthenticated['config'],
    };
    const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

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

    const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
      payload: {
        repository: {
          full_name: 'owner/repo',
        },
      },
      config: jest.fn()
        .mockRejectedValue(new Error('')) as unknown as ContextPayloadPushAuthenticated['config'],
    };
    const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

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
