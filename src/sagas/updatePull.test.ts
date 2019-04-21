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
} from '../entities/PayloadPush';

import {
  getPullNumber,
  getPullBaseBranch,
  getPullBranch,
} from '../entities/PullsListResponseItem';

import {
  Config,
  defaultConfig,
} from '../entities/config';

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
  UPDATE_SUCCESS_MESSAGES,
} from './updatePull';

const updateMethods: Config['updateMethod'][] = [
  'merge',
  'rebase',
];

type GithubCreateComment = ContextPayloadPushAuthenticated['github']['issues']['createComment'];
type GithubReposMerge = ContextPayloadPushAuthenticated['github']['repos']['merge'];

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
      repos: {
        merge: jest.fn() as unknown as GithubReposMerge,
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
      ref: 'master',
    },
    head: {
      ref: 'test-pr',
    },
  };

  const pull = mockedPull as unknown as PullsListResponseItem;

  describe.each(updateMethods)('%s', (updateMethod: Config['updateMethod']) => {
    const config: Config = {
      ...defaultConfig,
      updateMethod,
    };

    it('should correctly update the pull', async () => {
      await expectSaga(
        updatePullSaga,
        context,
        config,
        pull,
      )
        .run(false);

      if (config.updateMethod === 'merge') {
        expect(context.github.repos.merge).toHaveBeenCalledWith(
          {
            owner,
            repo,
            head: getPullBaseBranch(pull),
            base: getPullBranch(pull),
          },
        );
      } else {
        expect(rebasePullRequest).toHaveBeenCalledWith(
          {
            owner,
            repo,
            octokit: context.github,
            pullRequestNumber: getPullNumber(pull),
          },
        );
      }
    });

    it('send comment after update', async () => {
      await expectSaga(
        updatePullSaga,
        context,
        config,
        pull,
      )
        .run(false);

      const createComment = context.github.issues.createComment as unknown as jest.Mock;
      expect(createComment).toHaveBeenCalledWith({
        owner,
        repo,
        number: getPullNumber(pull),
        body: UPDATE_SUCCESS_MESSAGES[updateMethod](getPullBaseBranch(pull)),
      });
    });

    it('handle update error', async () => {
      const updateError = new Error();

      await expectSaga(
        updatePullSaga,
        context,
        config,
        pull,
      )
        .provide({
          call(effect, next) {
            if (
              effect.fn === rebasePullRequest
              || effect.fn === context.github.repos.merge
            ) {
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
        config,
        pull,
      )
        .provide({
          call(effect, next) {
            if (
              effect.fn === rebasePullRequest
              || effect.fn === context.github.repos.merge
            ) {
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
        config,
        pull,
      )
        .run(false);

      const error = context.log.error as unknown as jest.Mock;
      expect(error).toHaveBeenCalledWith(
        {
          ...getLogInfo(context),
          body: UPDATE_SUCCESS_MESSAGES[updateMethod](getPullBaseBranch(pull)),
          err: createCommentError,
          pullNumber: getPullNumber(pull),
        },
        'Can\'t create comment',
      );
    });
  });
});
