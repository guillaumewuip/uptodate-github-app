import {
  Application,
  Context,
} from 'probot';

import {
  createStore,
  Store,
} from 'redux';

import reducer from './reducer';

const bot = (app: Application, store: Store) => {
  app.on('*', async (context: Context) => {
    app.log(context);
  });
};

export = (app: Application) => {
  const store = createStore(reducer);

  bot(app, store);
};
