import {
  expectSaga,
} from 'redux-saga-test-plan';

import {
  call as callMatcher,
} from 'redux-saga-test-plan/matchers';

import {
  throwError,
} from 'redux-saga-test-plan/providers';

import {
  call,
} from 'redux-saga/effects';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  compose,
  toPairs,
  map,
} from 'ramda';

import {
  RecursivePartial,
} from '../types';

import {
  ContextPayloadPushAuthenticated,
  getLogInfo,
} from '../entities/eventPayloads';

import {
  errorMessages,
  updatePullSaga,
} from './updatePull';

type GithubCreateComment = ContextPayloadPushAuthenticated['github']['issues']['createComment'];

const tmpDir = '/tmp/dir';
const token = '13423443';
const owner = 'guillaumewuip';
const repo = 'uptodate-github-app';

jest.mock('tmp', () => {
  const removeCallback = jest.fn();

  return {
    dirSync: jest.fn().mockImplementation(() => ({
      removeCallback,
      name: tmpDir,
    })),
  };
});

jest.mock('../services/git', () => ({
  isGitError: (error: Error) => {
    // @ts-ignore
    return error.type !== undefined;
  },
  isRebaseError: (error: Error) => {
    // @ts-ignore
    return error.type === 'REBASE_ERROR';
  },
  cloneRebaseAndPush: jest.fn(),
}));

import {
  cloneRebaseAndPush,
  GitError,
  ERROR_TYPE,
} from '../services/git';

import {
  dirSync,
} from 'tmp';

const errors = compose<typeof errorMessages, [string, string][], [string, Error, string][]>(
  map(
    ([errorName, errorMessage]) => {
      const error = new Error(errorName) as GitError;
      error.type = errorName as ERROR_TYPE;
      // @ts-ignore
      error.files = [];

      return [
        errorName,
        error,
        errorMessage,
      ];
    },
  ),
  toPairs,
)(
  errorMessages,
);

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

  it('should call cloneRebaseAndPush correctly', async () => {
    await expectSaga(
      updatePullSaga,
      context,
      token,
      pull,
    )
      .run(false);

    const repoCloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

    expect(cloneRebaseAndPush).toHaveBeenCalledWith(
      repoCloneUrl,
      tmpDir,
      pull.head.ref,
      pull.base.ref,
    );
  });

  it('send comment after update', async () => {
    await expectSaga(
      updatePullSaga,
      context,
      token,
      pull,
    )
      .run(false);

    const createComment = context.github.issues.createComment as unknown as jest.Mock;
    expect(createComment).toHaveBeenCalledWith({
      owner,
      repo,
      number: pull.number,
      body: `Pull request rebased on ${pull.base.ref}`,
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
      token,
      pull,
    )
      .run(false);

    const error = context.log.error as unknown as jest.Mock;
    expect(error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        body: `Pull request rebased on ${pull.base.ref}`,
        err: createCommentError,
        pullNumber: pull.number,
      },
      'Can\'t create comment',
    );
  });

  it('remove tmp dir after update', async () => {
    await expectSaga(
      updatePullSaga,
      context,
      token,
      pull,
    )
      .run(false);

    const removeCallback = dirSync().removeCallback as jest.Mock;
    expect(removeCallback).toHaveBeenCalled();
  });

  it('remove tmp dir if cancelled', async () => {
    const gen = updatePullSaga(
      context,
      token,
      pull,
    );

    expect.assertions(1);

    if (!gen.return) {
      return ;
    }

    gen.next(); // start saga

    // cancel saga
    const removeCallback = dirSync().removeCallback;

    expect(gen.return().value).toEqual(
      call(
        removeCallback,
      ),
    );
  });

  describe.each(errors)(
    '%s', (_: string, error: Error, errorMessage: string) => {
      it('should send comment', async () => {
        await expectSaga(
          updatePullSaga,
          context,
          token,
          pull,
        )
          .provide([
            [callMatcher.fn(cloneRebaseAndPush), throwError(error)],
          ])
          .run(false);

        const createComment = context.github.issues.createComment as unknown as jest.Mock;
        expect(createComment).toHaveBeenCalledWith({
          owner,
          repo,
          number: pull.number,
          body: errorMessage,
        });
      });

      it('should handle createComment error', async () => {
        const createCommentError = new Error();

        type CreateComment = typeof context.github.issues.createComment;
        context.github.issues.createComment =
          jest.fn().mockRejectedValue(createCommentError) as unknown as CreateComment;

        await expectSaga(
          updatePullSaga,
          context,
          token,
          pull,
        )
          .provide([
            [callMatcher.fn(cloneRebaseAndPush), throwError(error)],
          ])
          .run(false);

        const errorLog = context.log.error as unknown as jest.Mock;
        expect(errorLog).toHaveBeenLastCalledWith(
          {
            ...getLogInfo(context),
            body: errorMessage,
            err: createCommentError,
            pullNumber: pull.number,
          },
          'Can\'t create comment',
        );
      });
    },
  );
});
