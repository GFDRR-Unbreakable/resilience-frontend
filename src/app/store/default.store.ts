import {Viewer} from '../store/model/viewer.model';

export interface AppStore {
    viewer: Viewer;
};

export const defaultStore: AppStore = {
    viewer: <Viewer> {}
};
