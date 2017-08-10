import { StoreModule } from '@ngrx/store';

import {viewer} from '../app/store/reducer/viewer';
import {policy} from '../app/store/reducer/policy';

const reducers = {
    viewer,
    policy
};

export const store = StoreModule.provideStore(viewer);
