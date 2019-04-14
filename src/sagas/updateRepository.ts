import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
  all,
} from 'redux-saga/effects';

import {
  WebhookPayloadPush,
} from '@octokit/webhooks';

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
  defaultBranch,
} from '../entities/eventPayloads';

import {
  updatePullSaga,
} from '../sagas/updatePull';

export const REBASE_LABEL = 'keep-rebased';

export function* updateRepositorySaga(
  app: Application,
  context: Context<WebhookPayloadPush>,
): SagaIterator {
  const {
    owner,
    name,
    full_name: fullName,
  } = context.payload.repository;

  const defaultRepositoryBranch = defaultBranch(context);

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

  const pullsToUpdate = filter(
    hasLabel(REBASE_LABEL), // TODO get config
    pulls,
  );

  if (isEmpty(pullsToUpdate)) {
    app.log(`No pull requests to update for ${fullName}`);

    return;
  }

  const pullsUpdates = map(
    (pull: PullsListResponseItem) => call(
      updatePullSaga,
      app,
      context,
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
