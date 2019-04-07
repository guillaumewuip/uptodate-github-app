import {
  Application as ProbotApplication,
} from 'probot';

import {
  Store,
} from 'redux';

export type Application = ProbotApplication & {
  store: Store,
};
