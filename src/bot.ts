import {
  Context,
} from 'probot';

import {
  Application,
} from './entities/Application';

import {
  PushEventPayload,
  isMasterUpdated,
} from './entities/eventPayloads';

import {
  repositoryUpdated,
} from './actions';

export = (app: Application) => {
  app.on('push', async (context: Context<PushEventPayload>) => {
    if (isMasterUpdated(context)) {
      app.store.dispatch(repositoryUpdated());
    }
  });
};
