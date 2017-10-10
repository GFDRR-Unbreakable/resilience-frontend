import {Viewer, ViewerModel} from '../store/model/viewer.model';
import {PolicyPriority} from '../store/model/policy.model';
/**
 * AppStore data interface which determines the type of data of root app state.
 */
export interface AppStore {
    viewer: Viewer;
    viewerModel1: ViewerModel;
    viewerModel2: ViewerModel;
    policyPriorityList: PolicyPriority;
};
/**
 * Default root-state data which is stored all app state data using the @ngrx library 
 */
export const defaultStore: AppStore = {
    viewer: <Viewer> {},
    viewerModel1: <ViewerModel> {},
    viewerModel2: <ViewerModel> {},
    policyPriorityList: <PolicyPriority> {}
};
