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
  Application,
} from '../entities/Application';

import {
  WebhookPayloadPushAuthenticated,
} from '../entities/eventPayloads';

import {
  ERRORS,
  cloneRebaseAndPush,
} from '../services/git';

export function* updatePullSaga(
  app: Application,
  context: Context<WebhookPayloadPushAuthenticated>,
  token: string,
  pull: PullsListResponseItem,
): SagaIterator {
}
