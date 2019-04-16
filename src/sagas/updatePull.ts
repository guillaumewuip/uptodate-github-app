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
  Context,
} from 'probot';

import {
  DirResult,
  dirSync,
} from 'tmp';

import {
  Application,
} from '../entities/Application';

import {
  WebhookPayloadPushAuthenticated,
} from '../entities/eventPayloads';

import {
  cloneRebaseAndPush,
  isRebaseError,
  ERROR_TYPE,
  RebaseError,
} from '../services/git';

export const errorMessages: {
  [k in ERROR_TYPE]: string;
} & {
  UNKNOWN_ERROR: string;
} = {
  CLONE_ERROR: 'Sorry ! Can\'t clone the repo.',
  PUSH_ERROR: 'Sorry ! Can\'t push the rebase.',
  REBASE_ERROR: 'Ooops ! Can\‘t rebase the PR. You probably have conflicts.',
  LEASE_ERROR: 'Oh ! It seems the remote branch has been updated. Can\'t force push safetly',
  UNKNOWN_ERROR: 'An unknown error happend updating the pull request.',
};

const getRepoCloneUrl = (
  token: string,
  owner: string,
  repo: string,
) => `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

function* handleError(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
  pull: PullsListResponseItem,
  error: RebaseError | Error,
): SagaIterator {
  const  {
    number: pullNumber,
    base: {
      repo: {
        full_name: fullName,
      },
    },
  } = pull;

  const type = isRebaseError(error)
    ? error.type
    : 'UNKNOWN_ERROR';

  const message = errorMessages[type];
  const params = context.issue({
    body: message,
  });

  params.number = pullNumber;

  try {
    yield call(
      context.github.issues.createComment,
      params,
    );
  } catch (error) {
    app.log(`Can't create comment for ${fullName} ${pull.number}`);
  }
}

function* handleSuccess(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
  pull: PullsListResponseItem,
  baseBranch: string,
): SagaIterator {
  const  {
    number: pullNumber,
    base: {
      repo: {
        full_name: fullName,
      },
    },
  } = pull;

  const message = `Pull request rebased on ${baseBranch}`;
  const params = context.issue({
    body: message,
  });

  params.number = pullNumber;

  try {
    yield call(
      context.github.issues.createComment,
      params,
    );
  } catch (error) {
    app.log(`Can't create comment for ${fullName} ${pull.number}`);
  }
}

export function* updatePullSaga(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
  token: string,
  pull: PullsListResponseItem,
): SagaIterator {
  let tmpDir: DirResult | undefined;

  const {
    base: {
      ref: baseBranch,
      repo: {
        owner,
        name,
        full_name: fullName,
      },
    },
    head: {
      ref: branch,
    },
  } = pull;

  try {
    app.log(`Updating ${fullName}/${branch}`);

    const repoCloneUrl = getRepoCloneUrl(token, owner.login, name);

    tmpDir = dirSync();

    yield call(
      cloneRebaseAndPush,
      repoCloneUrl,
      tmpDir.name,
      branch,
      baseBranch,
    );

    app.log(`Pull request rebase pushed for ${fullName}/${branch}`);

    yield call(
      handleSuccess,
      app,
      context,
      pull,
      baseBranch,
    );
  } catch (error) {
    const type = isRebaseError(error)
      ? error.type
      : 'UNKNOWN_ERROR';

    app.log(`${type} error updating ${fullName}/${branch}`);

    yield call(
      handleError,
      app,
      context,
      pull,
      error,
    );
  } finally {
    if (tmpDir !== undefined) {
      yield call(
        tmpDir.removeCallback,
      );
    }
  }
}
