import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
  all,
} from 'redux-saga/effects';

import {
  Response,
  PullsListResponseItem,
} from '@octokit/rest';

import {
  filter,
  isEmpty,
  map,
} from 'ramda';

import {
  hasLabel,
} from '../entities/PullsListResponseItem';

import {
  ContextPayloadPushAuthenticated,
  defaultBranch,
  getRepositoryFullName,
  getRepositoryName,
  getRepositoryOwnerLogin,
  getLogInfo,
} from '../entities/eventPayloads';

import {
  Config,
} from '../entities/config';

import {
  updatePullSaga,
} from './updatePull';

import {
  readRepoConfigSaga,
} from './readConfig';

export function* updateRepositorySaga(
  context: ContextPayloadPushAuthenticated,
): SagaIterator {
  const ownerLogin = getRepositoryOwnerLogin(context);
  const name = getRepositoryName(context);
  const fullName = getRepositoryFullName(context);

  const defaultRepositoryBranch = defaultBranch(context);

  const config: Config = yield call(
    readRepoConfigSaga,
    context,
  );

  let response: Response<PullsListResponseItem[]>;

  try {
    response = yield call(
      context.github.pulls.list,
      {
        owner: ownerLogin,
        repo: name,
        base: defaultRepositoryBranch,
      },
    );

    context.log.info(
      getLogInfo(context),
      'Pull requests fetched',
    );
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        err: error,
      },
      'Can\'t fetch pull requests',
    );

    return;
  }

  const pulls = response.data;

  context.log.info(
    {
      ...getLogInfo(context),
      label: config.keepUpdatedLabel,
    },
    'Filtering pull request by label',
  );

  const pullsToUpdate = filter(
    hasLabel(config.keepUpdatedLabel),
    pulls,
  );

  if (isEmpty(pullsToUpdate)) {
    context.log.info(
      getLogInfo(context),
      `No pull requests to update for ${fullName}`,
    );

    return;
  }

  const pullsUpdates = map(
    (pull: PullsListResponseItem) => call(
      updatePullSaga,
      context,
      pull,
    ),
    pullsToUpdate,
  );

  try {
    yield all(pullsUpdates);
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        err: error,
      },
      'Unknown error updating pull requests',
    );
  }
}
