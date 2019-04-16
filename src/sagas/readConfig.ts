import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
} from 'redux-saga/effects';

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
  Config,
  defaultConfig,
  CONFIG_FILE,
} from '../entities/config';

export function* readRepoConfigSaga(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
):SagaIterator {
  try {
    const config: Config = yield call(
      context.config.bind(context),
      CONFIG_FILE,
      defaultConfig,
    );

    return config;
  } catch (error) {
    const {
      payload: {
        repository: {
          full_name: fullName,
        },
      },
    } = context;

    app.log(`Can't get config for ${fullName}`);

    return defaultConfig;
  }
}
