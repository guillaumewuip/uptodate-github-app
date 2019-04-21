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
  ContextPayloadPullRequestReviewAuthenticated,
} from '../entities/PayloadPullRequestReview';

import {
  pullRequestsStatusUpdated,
} from '../actions/pullRequestStatusUpdated';

import {
  mergePullsSaga,
} from './mergePulls';

import {
  readRepoConfigSaga,
} from './readConfig';

import {
  Config,
  defaultConfig,
} from '../entities/config';

import {
  getLogInfo,
} from '../entities/withRepositoryAuthenticated';

const pullNumber = 134;
const pullSha = 'DSQRZER';
const ownerLogin = 'guillaumewuip';
const repo = 'test';

describe('sagas/mergePulls', () => {
  it('should fetch pull but not merge if no label', async () => {
    const pull: RecursivePartial<Response<PullsGetResponse>> = {
      data: {
        number: pullNumber,
        mergeable: true,
        labels: [],
        head: {
          sha: pullSha,
        },
      },
    };

    const mockedContext: RecursivePartial<ContextPayloadPullRequestReviewAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestReviewAuthenticated['log'],
      github: {
        pulls: {
          get: jest.fn().mockResolvedValue(pull),
          merge: jest.fn(),
        } as unknown as ContextPayloadPullRequestReviewAuthenticated['github']['pulls'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestReviewAuthenticated;

    const action = pullRequestsStatusUpdated(
      context,
      pullNumber,
    );

    const config: Config = {
      ...defaultConfig,
    };

    await expectSaga(
      mergePullsSaga,
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

    const getPull = context.github.pulls.get as unknown as jest.Mock;
    const mergePull = context.github.pulls.merge as unknown as jest.Mock;

    expect(getPull).toHaveBeenCalled();
    expect(mergePull).not.toHaveBeenCalled();
  });

  it('should fetch pull but not merge if not mergeable', async () => {
    const pull: RecursivePartial<Response<PullsGetResponse>> = {
      data: {
        number: pullNumber,
        mergeable: false,
        labels: [
          {
            name: defaultConfig.mergeLabel,
          },
        ],
        head: {
          sha: pullSha,
        },
      },
    };

    const mockedContext: RecursivePartial<ContextPayloadPullRequestReviewAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestReviewAuthenticated['log'],
      github: {
        pulls: {
          get: jest.fn().mockResolvedValue(pull),
          merge: jest.fn(),
        } as unknown as ContextPayloadPullRequestReviewAuthenticated['github']['pulls'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestReviewAuthenticated;

    const action = pullRequestsStatusUpdated(
      context,
      pullNumber,
    );

    const config: Config = {
      ...defaultConfig,
    };

    await expectSaga(
      mergePullsSaga,
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

    const getPull = context.github.pulls.get as unknown as jest.Mock;
    const mergePull = context.github.pulls.merge as unknown as jest.Mock;

    expect(getPull).toHaveBeenCalled();
    expect(mergePull).not.toHaveBeenCalled();
  });

  it('should fetch pull and merge', async () => {
    const pull: RecursivePartial<Response<PullsGetResponse>> = {
      data: {
        number: pullNumber,
        mergeable: true,
        labels: [
          {
            name: defaultConfig.mergeLabel,
          },
        ],
        head: {
          sha: pullSha,
        },
      },
    };

    const mockedContext: RecursivePartial<ContextPayloadPullRequestReviewAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestReviewAuthenticated['log'],
      github: {
        pulls: {
          get: jest.fn().mockResolvedValue(pull),
          merge: jest.fn(),
        } as unknown as ContextPayloadPullRequestReviewAuthenticated['github']['pulls'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestReviewAuthenticated;

    const action = pullRequestsStatusUpdated(
      context,
      pullNumber,
    );

    const config: Config = {
      ...defaultConfig,
    };

    await expectSaga(
      mergePullsSaga,
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

    const getPull = context.github.pulls.get as unknown as jest.Mock;
    const mergePull = context.github.pulls.merge as unknown as jest.Mock;

    expect(getPull).toHaveBeenCalled();
    expect(mergePull).toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const fetchError = new Error();

    const mockedContext: RecursivePartial<ContextPayloadPullRequestReviewAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestReviewAuthenticated['log'],
      github: {
        pulls: {
          get: jest.fn().mockRejectedValue(fetchError),
          merge: jest.fn(),
        } as unknown as ContextPayloadPullRequestReviewAuthenticated['github']['pulls'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestReviewAuthenticated;

    const action = pullRequestsStatusUpdated(
      context,
      pullNumber,
    );

    const config: Config = {
      ...defaultConfig,
    };

    await expectSaga(
      mergePullsSaga,
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

    const getPull = context.github.pulls.get as unknown as jest.Mock;
    const mergePull = context.github.pulls.merge as unknown as jest.Mock;

    const error = context.log.error as unknown as jest.Mock;

    expect(getPull).toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        pullNumber,
        err: fetchError,
      },

      'Can\'t fetch pull request',
    );
    expect(mergePull).not.toHaveBeenCalled();
  });
  it('should handle fetch error', async () => {
    const mergeError = new Error();

    const pull: RecursivePartial<Response<PullsGetResponse>> = {
      data: {
        number: pullNumber,
        mergeable: true,
        labels: [
          {
            name: defaultConfig.mergeLabel,
          },
        ],
        head: {
          sha: pullSha,
        },
      },
    };

    const mockedContext: RecursivePartial<ContextPayloadPullRequestReviewAuthenticated> = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as unknown as ContextPayloadPullRequestReviewAuthenticated['log'],
      github: {
        pulls: {
          get: jest.fn().mockResolvedValue(pull),
          merge: jest.fn().mockRejectedValue(mergeError),
        } as unknown as ContextPayloadPullRequestReviewAuthenticated['github']['pulls'],
      },
      payload: {
        repository: {
          owner: {
            login: ownerLogin,
            name: repo,
          },
        },
        installation: {
          id: 1,
        },
      },
    };

    const context = mockedContext as unknown as ContextPayloadPullRequestReviewAuthenticated;

    const action = pullRequestsStatusUpdated(
      context,
      pullNumber,
    );

    const config: Config = {
      ...defaultConfig,
    };

    await expectSaga(
      mergePullsSaga,
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

    const getPull = context.github.pulls.get as unknown as jest.Mock;
    const mergePull = context.github.pulls.merge as unknown as jest.Mock;

    const error = context.log.error as unknown as jest.Mock;

    expect(getPull).toHaveBeenCalled();
    expect(mergePull).toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      {
        ...getLogInfo(context),
        pullNumber,
        err: mergeError,
      },
      'Can\'t merge pull request',
    );
  });
});
