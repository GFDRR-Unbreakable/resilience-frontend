import { StoreModule } from '@ngrx/store';

import {viewer, viewerModel1, viewerModel2} from '../app/store/reducer/viewer';
import {policy} from '../app/store/reducer/policy';

const reducers = {
    policy,
    viewer,
    viewerModel1,
    viewerModel2
};

export const store = StoreModule.provideStore(viewer);
