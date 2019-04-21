import {
  ContextPayloadPullRequestReviewAuthenticated,
} from '../entities/PayloadPullRequestReview';

import {
  ContextPayloadCheckSuiteAuthenticated,
} from '../entities/PayloadCheckSuite';

export const PULL_REQUEST_STATUS_UPDATED = 'PULL_REQUEST_STATUS_UPDATED';

export type PullRequestStatusUpdatedAction = {
  type: typeof PULL_REQUEST_STATUS_UPDATED,
  context: ContextPayloadCheckSuiteAuthenticated | ContextPayloadPullRequestReviewAuthenticated,
  pullNumber: number,
};

export const pullRequestsStatusUpdated = (
  context: ContextPayloadCheckSuiteAuthenticated | ContextPayloadPullRequestReviewAuthenticated,
  pullNumber: number,
): PullRequestStatusUpdatedAction => ({
  context,
  pullNumber,
  type: 'PULL_REQUEST_STATUS_UPDATED',
});

