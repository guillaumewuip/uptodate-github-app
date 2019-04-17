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
  isGitError,
  ERROR_TYPE,
  GitError,
  isRebaseError,
} from '../services/git';

export const errorMessages: {
  [k in ERROR_TYPE]: string;
} & {
  UNKNOWN_ERROR: string;
} = {
  CLONE_ERROR: 'Sorry ! Can\'t clone the repo.',
  PUSH_ERROR: 'Sorry ! Can\'t push the rebase.',
  REBASE_ERROR: 'Can\‘t rebase the PR. Conflicts with these files :',
  UNKNOWN_REBASE_ERROR: 'Ooops ! Can\‘t rebase the PR for a unknown reason.',
  LEASE_ERROR: 'Oh ! It seems the remote branch has been updated. Can\'t force push safetly',
  UNKNOWN_ERROR: 'An unknown error happend updating the pull request.',
};

const getRepoCloneUrl = (
  token: string,
  owner: string,
  repo: string,
) => `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

function* sendComment(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
  params: {
    owner: string,
    repo: string,
    number: number,
    body: string,
  },
): SagaIterator {
  const  {
    payload: {
      repository: {
        full_name: fullName,
      },
    },
  } = context;

  try {
    yield call(
      context.github.issues.createComment,
      params,
    );
  } catch (error) {
    app.log(`Can't create comment for ${fullName} ${params.number}`);
  }
}

function* handleError(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
  pull: PullsListResponseItem,
  error: GitError | Error,
): SagaIterator {
  const {
    number: pullNumber,
  } = pull;

  if (!isGitError(error)) {
    const params = context.issue({
      body: errorMessages.UNKNOWN_ERROR,
    });

    params.number = pullNumber;

    yield call(
      sendComment,
      app,
      context,
      params,
    );

    return;
  }

  if (!isRebaseError(error)) {
    const params = context.issue({
      body: errorMessages[error.type],
    });

    params.number = pullNumber;

    yield call(
      sendComment,
      app,
      context,
      params,
    );

    return;
  }

  const filesList = error.files
    .map(filePath => `\n- ${filePath}`)

  const message = `${errorMessages.REBASE_ERROR}${filesList}`;

  const params = context.issue({
    body: message,
  });

  params.number = pullNumber;

  yield call(
    sendComment,
    app,
    context,
    params,
  );
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
      sendComment,
      app,
      context,
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
    const type = isGitError(error)
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
