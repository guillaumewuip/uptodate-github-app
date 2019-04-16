import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
  all,
} from 'redux-saga/effects';

import {
  Response,
  PullsListResponseItem,
} from '@octokit/rest';

import {
  filter,
  isEmpty,
  map,
} from 'ramda';

import {
  Context,
} from 'probot';

import {
  Application,
} from '../entities/Application';

import {
  hasLabel,
} from '../entities/PullsListResponseItem';

import {
  WebhookPayloadPushAuthenticated,
  defaultBranch,
} from '../entities/eventPayloads';

import {
  Config,
} from '../entities/config';

import {
  updatePullSaga,
} from './updatePull';

import {
  readRepoConfigSaga,
} from './readConfig';

export const REBASE_LABEL = 'keep-rebased';

function* getRepositoryAccessToken(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
): SagaIterator {
  const {
    payload: {
      installation: {
        id,
      },
    },
  } = context;

  const token = yield call(
    app.app.getInstallationAccessToken,
    {
      installationId: id,
    },
  );

  return token;
}

export function* updateRepositorySaga(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
): SagaIterator {
  const {
    owner,
    name,
    full_name: fullName,
  } = context.payload.repository;

  const defaultRepositoryBranch = defaultBranch(context);

  const config: Config = yield call(
    readRepoConfigSaga,
    app,
    context,
  );

  let response: Response<PullsListResponseItem[]>;

  try {
    response = yield call(
      context.github.pulls.list,
      {
        owner: owner.login,
        repo: name,
        base: defaultRepositoryBranch,
      },
    );

    app.log(`Pull requests fetched for ${fullName}`);
  } catch (error) {
    app.log(`Can't fetch pull requests for ${fullName}`);

    return;
  }

  const pulls = response.data;

  app.log(`Filtering pull request by label ${config.keepUpdatedLabel} for ${fullName}`);

  const pullsToUpdate = filter(
    hasLabel(config.keepUpdatedLabel),
    pulls,
  );

  if (isEmpty(pullsToUpdate)) {
    app.log(`No pull requests to update for ${fullName}`);

    return;
  }

  let repositoryToken: string;

  try {
    repositoryToken = yield call(
      getRepositoryAccessToken,
      app,
      context,
    );
  } catch (error) {
    app.log(`Can't get repositoryToken for ${fullName}`);

    return;
  }

  const pullsUpdates = map(
    (pull: PullsListResponseItem) => call(
      updatePullSaga,
      app,
      context,
      repositoryToken,
      pull,
    ),
    pullsToUpdate,
  );

  try {
    yield all(pullsUpdates);
  } catch (error) {
    app.log(`Unknown error updating pull requests for ${fullName}`);
  }
}
