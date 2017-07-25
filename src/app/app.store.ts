import { StoreModule } from '@ngrx/store';

import {viewer} from '../app/store/reducer/viewer';

const reducers = {
    viewer
};

export const store = StoreModule.provideStore(viewer);
