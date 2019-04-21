import {
  forEach,
} from 'ramda';

import {
  Application,
} from './entities/Application';

import {
  ContextPayloadPush,
  isAuthenticated as isPushAuthenticated,
  isDefaultBranchUpdated,
} from './entities/PayloadPush';

import {
  ContextPayloadCheckSuite,
  isAuthenticated as isCheckSuiteAuthenticated,
  getPullsNumber,
} from './entities/PayloadCheckSuite';

import {
  ContextPayloadPullRequestReview,
  isAuthenticated as isPullRequestReviewAuthenticated,
  getPullNumber,
} from './entities/PayloadPullRequestReview';

import {
  ContextPayloadPullRequest,
  isAuthenticated as isPullRequestAuthenticated,
  isMerged,
} from './entities/PayloadPullRequest';

import {
  repositoryUpdated,
} from './actions/updateRepository';

import {
  pullRequestsStatusUpdated,
} from './actions/pullRequestStatusUpdated';

import {
  pullRequestMerged,
} from './actions/pullRequestMerged';

export = (app: Application) => {
  app.on('push', async (context: ContextPayloadPush) => {
    if (!isPushAuthenticated(context)) {
      app.log.info('Received non-authenticated push payload');

      return;
    }

    if (!isDefaultBranchUpdated(context)) {
      return;
    }

    const action = repositoryUpdated(
      context,
    );
    app.store.dispatch(action);
  });

  app.on('check_suite.completed', async (context: ContextPayloadCheckSuite) => {
    if (!isCheckSuiteAuthenticated(context)) {
      app.log.info('Received non-authenticated check_suite payload');

      return;
    }

    const pullNumbers = getPullsNumber(context);

    forEach(
      (pullNumber: number) => app.store.dispatch(pullRequestsStatusUpdated(context, pullNumber)),
    )(pullNumbers);
  });

  app.on('pull_request_review.submitted', async (context: ContextPayloadPullRequestReview) => {
    if (!isPullRequestReviewAuthenticated(context)) {
      app.log.info('Received non-authenticated pull_request_review payload');

      return;
    }

    const pullNumber = getPullNumber(context);

    app.store.dispatch(pullRequestsStatusUpdated(context, pullNumber));
  });

  app.on('pull_request.closed', async (context: ContextPayloadPullRequest) => {
    if (!isPullRequestAuthenticated(context)) {
      app.log.info('Received non-authenticated pull_request.closed payload');

      return;
    }

    const merged = isMerged(context);

    if (merged) {
      app.store.dispatch(pullRequestMerged(context));
    }
  });
};
