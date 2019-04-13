import {
  createStore,
  applyMiddleware,
} from 'redux';

import createSagaMiddleware from 'redux-saga';

import bot from './bot';
import reducer from './reducer';

import {
  updateRepositoriesSaga,
} from './sagas/updateRepositories';

import {
  Application,
} from './entities/Application';

export = (app: Application) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    reducer,
    applyMiddleware(
      sagaMiddleware,
    ),
  );

  sagaMiddleware.run(
    updateRepositoriesSaga,
    app,
  );

  app.store = store;

  bot(app);
};
