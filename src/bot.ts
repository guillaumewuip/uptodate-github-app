import {
  Context,
} from 'probot';

import {
  WebhookPayloadPush,
} from '@octokit/webhooks';

import {
  Application,
} from './entities/Application';

import {
  WebhookPayloadPushAuthenticated,
  isAuthenticated,
  isDefaultBranchUpdated,
} from './entities/eventPayloads';

import {
  repositoryUpdated,
} from './actions/updateRepository';

export = (app: Application) => {
  app.on('push', async (context: Context<WebhookPayloadPush>) => {
    if (!isDefaultBranchUpdated(context)) {
      return;
    }

    if (!isAuthenticated(context)) {
      app.log('Received non-authenticated payload');

      return;
    }

    const action = repositoryUpdated(
      context.payload.repository,
      context,
    );
    app.store.dispatch(action);
  });
};
