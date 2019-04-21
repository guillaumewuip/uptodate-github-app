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
  getPullBranch,
} from '../entities/PullsListResponseItem';

import {
  ContextPayloadPushAuthenticated,
  getRepositoryOwnerLogin,
  getRepositoryName,
  getLogInfo,
} from '../entities/PayloadPush';

import {
  Config,
  getUpdateMethod,
} from '../entities/config';

export const UPDATE_SUCCESS_MESSAGES: {
  [k in Config['updateMethod']]: (baseBranch: string) => string;
} = {
  merge: (baseBranch: string) => `Merged ${baseBranch} on pull request`,
  rebase: (baseBranch: string) => `Pull request rebased on ${baseBranch}`,
};

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
  config: Config,
  pull: PullsListResponseItem,
): SagaIterator {
  const ownerLogin = getRepositoryOwnerLogin(context);
  const name = getRepositoryName(context);
  const baseBranch = getPullBaseBranch(pull);
  const branch = getPullBranch(pull);
  const pullNumber = getPullNumber(pull);

  try {
    context.log.info(
      {
        ...getLogInfo(context),
        pullNumber: getPullNumber(pull),
      },
      'Updating pull request',
    );

    const updateMethod = getUpdateMethod(config);

    if (updateMethod === 'merge') {
      yield call(
        context.github.repos.merge,
        {
          owner: ownerLogin,
          repo: name,
          head: baseBranch,
          base: branch,
        },
      );

      context.log.info(
        {
          ...getLogInfo(context),
          pullNumber,
        },
        'Pull request merge done',
      );

      const message = UPDATE_SUCCESS_MESSAGES.merge(baseBranch);
      yield call(
        sendComment,
        context,
        pullNumber,
        message,
      );

      return;
    }

    // default to rebase

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
      'Pull request rebase done',
    );

    const message = UPDATE_SUCCESS_MESSAGES.rebase(baseBranch);
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
