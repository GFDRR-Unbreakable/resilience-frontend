import {Viewer, ViewerModel} from '../store/model/viewer.model';
import {PolicyPriority} from '../store/model/policy.model';

export interface AppStore {
    viewer: Viewer;
    viewerModel1: ViewerModel;
    viewerModel2: ViewerModel;
    policyPriorityList: PolicyPriority;
};

export const defaultStore: AppStore = {
    viewer: <Viewer> {},
    viewerModel1: <ViewerModel> {},
    viewerModel2: <ViewerModel> {},
    policyPriorityList: <PolicyPriority> {}
};
