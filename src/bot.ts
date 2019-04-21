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
  repositoryUpdated,
} from './actions/updateRepository';

import {
  pullRequestsStatusUpdated,
} from './actions/pullRequestStatusUpdated';

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
};
