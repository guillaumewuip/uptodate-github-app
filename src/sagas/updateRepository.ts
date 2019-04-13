import {
  SagaIterator,
} from 'redux-saga';

import {
  call,
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
} from 'ramda';

import {
  Context,
} from 'probot';

import {
  Application,
} from '../entities/Application';

import {
  hasLabel,
} from '../helpers';

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

  app.log(`Fetching pull request for ${fullName}`);

  try {
    const response: Response<PullsListResponseItem[]> = yield call(
      context.github.pulls.list,
      {
        owner: owner.login,
        repo: name,
        base: 'master', // TODO use real base
      },
    );

    const pulls = response.data;

    const pullsToUpdate = filter(
      hasLabel(REBASE_LABEL), // TODO get config
      pulls,
    );

    if (isEmpty(pullsToUpdate)) {
      app.log(`No pull requests to update for ${fullName}`);

      return;
    }
  } catch (error) {
    // TODO
  }
}
