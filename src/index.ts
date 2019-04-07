import {
  createStore,
} from 'redux';

import bot from './bot';
import reducer from './reducer';

import {
  Application,
} from './entities/Application';

module.exports = (app: Application) => {
  const store = createStore(reducer);

  app.store = store;

  bot(app);
};
