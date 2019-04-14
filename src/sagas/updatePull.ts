import {
  SagaIterator,
} from 'redux-saga';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  WebhookPayloadPush,
} from '@octokit/webhooks';

import {
  Context,
} from 'probot';

import {
  Application,
} from '../entities/Application';

export function* updatePullSaga(
  app: Application,
  context: Context<WebhookPayloadPush>,
  pull: PullsListResponseItem,
): SagaIterator {

}
