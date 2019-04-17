import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
} from 'redux-saga/effects';

import {
  Application,
} from '../entities/Application';

import {
  ContextPayloadPushAuthenticated,
  getRepositoryFullName,
} from '../entities/eventPayloads';

import {
  Config,
  defaultConfig,
  CONFIG_FILE,
} from '../entities/config';

export function* readRepoConfigSaga(
  app: Application,
  context: ContextPayloadPushAuthenticated,
):SagaIterator {
  try {
    const config: Config = yield call(
      context.config.bind(context),
      CONFIG_FILE,
      defaultConfig,
    );

    return config;
  } catch (error) {
    const fullName = getRepositoryFullName(context);

    app.log(`Can't get config for ${fullName}`);

    return defaultConfig;
  }
}
