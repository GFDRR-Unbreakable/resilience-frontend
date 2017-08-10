import {Viewer} from '../store/model/viewer.model';
import {PolicyPriority} from '../store/model/policy.model';

export interface AppStore {
    viewer: Viewer;
    policyPriorityList: PolicyPriority;
};

export const defaultStore: AppStore = {
    viewer: <Viewer> {},
    policyPriorityList: <PolicyPriority> {}
};
