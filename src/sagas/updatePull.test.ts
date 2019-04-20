import {
  expectSaga,
} from 'redux-saga-test-plan';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  RecursivePartial,
} from '../types';

import {
  ContextPayloadPushAuthenticated,
  getLogInfo,
} from '../entities/eventPayloads';

import {
  getPullNumber,
} from '../entities/PullsListResponseItem';

type GithubCreateComment = ContextPayloadPushAuthenticated['github']['issues']['createComment'];

const owner = 'guillaumewuip';
const repo = 'uptodate-github-app';

jest.mock('github-rebase', () => ({
  rebasePullRequest: jest.fn().mockResolvedValue({}),
}));

import {
  rebasePullRequest,
} from 'github-rebase';

import {
  updatePullSaga,
} from './updatePull';

describe('sagas/updatePull', () => {
  const mockedContext: RecursivePartial<ContextPayloadPushAuthenticated> = {
    log: {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as ContextPayloadPushAuthenticated['log'],
    issue: ({ body }: { body: string }) => ({
      body,
      owner,
      repo,
    }),
    github: {
      issues: {
        createComment: jest.fn() as unknown as GithubCreateComment,
      },
    },
    payload: {
      repository: {
        owner: {
          login: owner,
        },
        name: repo,
      },
      installation: {
        id: 1,
      },
    },
  };

  const context = mockedContext as unknown as ContextPayloadPushAuthenticated;

  beforeEach(() => {
    (context.github.issues.createComment as unknown as jest.Mock).mockReset();
    (context.log.info as unknown as jest.Mock).mockReset();
    (context.log.error as unknown as jest.Mock).mockReset();
    (rebasePullRequest as unknown as jest.Mock).mockReset();

    jest.resetModules();
  });

  const mockedPull: RecursivePartial<PullsListResponseItem> = {
    number: 1,
    base: {
      ref: 'test-pr',
    },
    head: {
      ref: 'master',
    },
  };

  const pull = mockedPull as unknown as PullsListResponseItem;

  it('should call rebasePullRequest correctly', async () => {
    await expectSaga(
      updatePullSaga,
      context,
      pull,
    )
      .run(false);

    expect(rebasePullRequest).toHaveBeenCalledWith(
      {
        owner,
        repo,
        octokit: context.github,
        pullRequestNumber: getPullNumber(pull),
      },
    );
  });

  it('send comment after update', async () => {
    await expectSaga(
      updatePullSaga,
      context,
      pull,
    )
      .run(false);

    const createComment = context.github.issues.createComment as unknown as jest.Mock;
    expect(createComment).toHaveBeenCalledWith({
      owner,
      repo,
      number: getPullNumber(pull),
      body: `Pull request rebased on ${pull.base.ref}`,
    });
  });

  it('handle update error', async () => {
    const updateError = new Error();

    await expectSaga(
      updatePullSaga,
      context,
      pull,
    )
      .provide({
        call(effect, next) {
          if (effect.fn === rebasePullRequest) {
            throw updateError;
          }

          return next();
        },
      })
      .run(false);

    const error = context.log.error as unknown as jest.Mock;
    expect(error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        err: updateError,
        pullNumber: getPullNumber(pull),
      },
      'Error updating pull request',
    );
  });

  it('send comment after update error', async () => {
    const updateError = new Error();

    await expectSaga(
      updatePullSaga,
      context,
      pull,
    )
      .provide({
        call(effect, next) {
          if (effect.fn === rebasePullRequest) {
            throw updateError;
          }

          return next();
        },
      })
      .run(false);

    const createComment = context.github.issues.createComment as unknown as jest.Mock;
    expect(createComment).toHaveBeenCalledWith({
      owner,
      repo,
      number: getPullNumber(pull),
      body: 'Can\'t update the pull request',
    });
  });

  it('handle createComment error', async () => {
    const createCommentError = new Error();

    type CreateComment = typeof context.github.issues.createComment;
    context.github.issues.createComment =
      jest.fn().mockRejectedValue(createCommentError) as unknown as CreateComment;

    await expectSaga(
      updatePullSaga,
      context,
      pull,
    )
      .run(false);

    const error = context.log.error as unknown as jest.Mock;
    expect(error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        body: `Pull request rebased on ${pull.base.ref}`,
        err: createCommentError,
        pullNumber: getPullNumber(pull),
      },
      'Can\'t create comment',
    );
  });
});
