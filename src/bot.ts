import {
  Application,
} from './entities/Application';

import {
  ContextPayloadPush,
  isAuthenticated,
  isDefaultBranchUpdated,
} from './entities/eventPayloads';

import {
  repositoryUpdated,
} from './actions/updateRepository';

export = (app: Application) => {
  app.on('push', async (context: ContextPayloadPush) => {
    if (!isAuthenticated(context)) {
      app.log.info('Received non-authenticated payload');

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
};
