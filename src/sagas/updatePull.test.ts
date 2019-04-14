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
  Context,
} from 'probot';

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
  Application,
} from '../entities/Application';

import {
  WebhookPayloadPushAuthenticated,
} from '../entities/eventPayloads';

import {
  errorMessages,
  updatePullSaga,
} from './updatePull';

type WebhookPayloadPushContext = Context<WebhookPayloadPushAuthenticated>;
type GithubCreateComment = Context['github']['issues']['createComment'];

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
  isRebaseError: (error: Error) => {
    // @ts-ignore
    return error.type !== undefined;
  },
  cloneRebaseAndPush: jest.fn(),
}));

import {
  cloneRebaseAndPush,
  RebaseError,
  ERROR_TYPE,
} from '../services/git';

import {
  dirSync,
} from 'tmp';

const errors = compose<typeof errorMessages, [string, string][], [string, Error, string][]>(
  map(
    ([errorName, errorMessage]) => {
      const error = new Error(errorName) as RebaseError;
      error.type = errorName as ERROR_TYPE;

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
  const app = {
    log: jest.fn(),
  } as unknown as Application;

  const mockedContext: RecursivePartial<WebhookPayloadPushContext> = {
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
  };

  const context = mockedContext as unknown as WebhookPayloadPushContext;

  beforeEach(() => {
    (context.github.issues.createComment as unknown as jest.Mock).mockReset();
    jest.resetModules();
  });

  const mockedPull: RecursivePartial<PullsListResponseItem> = {
    number: 1,
    base: {
      ref: 'test-pr',
      repo: {
        owner: {
          login: owner,
        },
        name: repo,
        full_name: `${owner}/${repo}`,
      },
    },
    head: {
      ref: 'master',
    },
  };

  const pull = mockedPull as unknown as PullsListResponseItem;

  it('should call cloneRebaseAndPush correctly', async () => {
    await expectSaga(
      updatePullSaga,
      app,
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
      app,
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

  it('remove tmp dir after update', async () => {
    await expectSaga(
      updatePullSaga,
      app,
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
      app,
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

  it.each(errors)(
    'should handle %s error correctly',
    async (_: string, error: Error, errorMessage: string) => {
      await expectSaga(
        updatePullSaga,
        app,
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
    },
  );
});
