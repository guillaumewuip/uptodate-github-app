import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
} from 'redux-saga/effects';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  rebasePullRequest,
} from 'github-rebase';

import {
  getPullNumber,
  getPullBaseBranch,
} from '../entities/PullsListResponseItem';

import {
  getRepositoryOwnerLogin,
  ContextPayloadPushAuthenticated,
  getRepositoryName,
  getLogInfo,
} from '../entities/eventPayloads';

function* sendComment(
  context: ContextPayloadPushAuthenticated,
  pullNumber: number,
  body: string,
): SagaIterator {
  const params = context.issue({
    body,
  });

  params.number = pullNumber;

  try {
    yield call(
      context.github.issues.createComment,
      params,
    );
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        pullNumber: params.number,
        body: params.body,
        err: error,
      },
      'Can\'t create comment',
    );
  }
}

export function* updatePullSaga(
  context: ContextPayloadPushAuthenticated,
  pull: PullsListResponseItem,
): SagaIterator {
  const ownerLogin = getRepositoryOwnerLogin(context);
  const name = getRepositoryName(context);
  const baseBranch = getPullBaseBranch(pull);
  const pullNumber = getPullNumber(pull);

  try {
    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber: getPullNumber(pull),
      },
      'Updating pull request',
    );

    yield call(
      rebasePullRequest,
      {
        // @ts-ignore
        octokit: context.github,
        owner: ownerLogin,
        repo: name,
        pullRequestNumber: pullNumber,
      },
    );

    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber,
      },
      'Pull request update done',
    );

    const message = `Pull request rebased on ${baseBranch}`;
    yield call(
      sendComment,
      context,
      pullNumber,
      message,
    );
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        pullNumber,
        err: error,
      },
      'Error updating pull request',
    );

    yield call(
      sendComment,
      context,
      pullNumber,
      'Can\'t update the pull request',
    );
  }
}
