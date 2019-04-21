import {
  expectSaga,
} from 'redux-saga-test-plan';

import {
  Response,
  PullsGetResponse,
} from '@octokit/rest';

import {
  RecursivePartial,
} from '../types';

import {
  ContextPayloadPullRequestAuthenticated,
} from '../entities/PayloadPullRequest';

import {
  pullRequestMerged,
} from '../actions/pullRequestMerged';

import {
  Config,
  defaultConfig,
} from '../entities/config';

import {
  getLogInfo,
} from '../entities/withRepositoryAuthenticated';

import {
  readRepoConfigSaga,
} from './readConfig';

import {
  deleteBranchesSaga,
} from './deleteBranch';

const ownerLogin = 'guillaumewuip';
const repo = 'test';

describe('sagas/deleteBranchesSaga', () => {
  it('should not delete branch if not asked by config', async () => {
    const mockedContext: RecursivePartial<ContextPayloadPullRequestAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestAuthenticated['log'],
      github: {
        git: {
          deleteRef: jest.fn(),
        } as unknown as ContextPayloadPullRequestAuthenticated['github']['git'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        pull_request: {
          head: {
            ref: 'test-branch',
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestAuthenticated;

    const action = pullRequestMerged(
      context,
    );

    const config: Config = {
      ...defaultConfig,
      deleteBranchAfterMerge: false,
    };

    await expectSaga(
      deleteBranchesSaga,
    )
      .provide({
        call(effect, next) {
          if (effect.fn === readRepoConfigSaga) {
            return config;
          }

          return next();
        },
      })
      .dispatch(action)
      .silentRun();

    const deleteRef = context.github.git.deleteRef as unknown as jest.Mock;
    expect(deleteRef).not.toHaveBeenCalled();
  });

  it('should delete branch if asked by config', async () => {
    const mockedContext: RecursivePartial<ContextPayloadPullRequestAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestAuthenticated['log'],
      github: {
        git: {
          deleteRef: jest.fn(),
        } as unknown as ContextPayloadPullRequestAuthenticated['github']['git'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        pull_request: {
          head: {
            ref: 'test-branch',
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestAuthenticated;

    const action = pullRequestMerged(
      context,
    );

    const config: Config = {
      ...defaultConfig,
      deleteBranchAfterMerge: true,
    };

    await expectSaga(
      deleteBranchesSaga,
    )
      .provide({
        call(effect, next) {
          if (effect.fn === readRepoConfigSaga) {
            return config;
          }

          return next();
        },
      })
      .dispatch(action)
      .silentRun();

    const deleteRef = context.github.git.deleteRef as unknown as jest.Mock;
    expect(deleteRef).toHaveBeenCalled();
  });
});
