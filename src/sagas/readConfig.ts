import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
} from 'redux-saga/effects';

import {
} from '../entities/PayloadPush';

import {
  getLogInfo,
  ContextWithRepositoryAuthenticated,
} from '../entities/withRepositoryAuthenticated';

import {
  Config,
  defaultConfig,
  CONFIG_FILE,
} from '../entities/config';

export function* readRepoConfigSaga(
  context: ContextWithRepositoryAuthenticated,
):SagaIterator {
  try {
    const config: Config = yield call(
      context.config.bind(context),
      CONFIG_FILE,
      defaultConfig,
    );

    return config;
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        err: error,
      },
      'Can\'t get config',
    );

    return defaultConfig;
  }
}
