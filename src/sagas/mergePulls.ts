import {
  SagaIterator,
} from 'redux-saga';

import {
  takeEvery,
  call,
} from 'redux-saga/effects';

import {
  Response,
  PullsGetResponse,
} from '@octokit/rest';

import {
  PullRequestStatusUpdatedAction,
  PULL_REQUEST_STATUS_UPDATED,
} from '../actions/pullRequestStatusUpdated';

import {
  getLogInfo,
  getRepositoryOwnerLogin,
  getRepositoryName,
} from '../entities/withRepositoryAuthenticated';

import {
  isMergeable,
  getHeadSha,
  hasLabel,
} from '../entities/PullsGetResponse';

import {
  Config,
  getReadyToMergeLabel,
} from '../entities/config';

import {
  readRepoConfigSaga,
} from './readConfig';

function* mergePullSaga(
  action: PullRequestStatusUpdatedAction,
): SagaIterator {
  const {
    pullNumber,
    context,
  } = action;

  context.log.info(
    {
      ...getLogInfo(context),
      pullNumber,
    },
    'Pull request status update received',
  );

  const config: Config = yield call(
    readRepoConfigSaga,
    context,
  );

  let response: Response<PullsGetResponse>;

  const owner = getRepositoryOwnerLogin(context);
  const repo = getRepositoryName(context);

  try {
    response = yield call(
      context.github.pulls.get,
      {
        owner,
        repo,
        number: pullNumber,
      },
    );

    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber,
      },
      'Pull request fetched',
    );
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        pullNumber,
        err: error,
      },
      'Can\'t fetch pull request',
    );

    return;
  }

  const pull = response.data;

  const shouldBeMerged = hasLabel(getReadyToMergeLabel(config))(pull);

  // stop here if label is not set
  if (!shouldBeMerged) {
    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber,
      },
      'Pull request should not be merge because no label',
    );

    return;
  }

  const mergeable = isMergeable(pull);

  // stop here if pull is not mergeabled
  if (!mergeable) {
    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber,
      },
      'Pull request is not mergeable',
    );

    return;
  }

  try {
    yield call(
      context.github.pulls.merge,
      {
        owner,
        repo,
        number: pullNumber,
        sha: getHeadSha(pull),
        merge_method: 'merge',
      },
    );

    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber,
      },
      'Pull request merged',
    );
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        pullNumber,
        err: error,
      },
      'Can\'t merge pull request',
    );

    return;
  }
}

export function* mergePullsSaga(): SagaIterator {
  yield takeEvery(
    PULL_REQUEST_STATUS_UPDATED,
    mergePullSaga,
  );
}
