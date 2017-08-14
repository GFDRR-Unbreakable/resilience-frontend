import { Action } from '@ngrx/store';
import * as fromStore from '../default.store';
import {ViewerAction} from '../action/viewer.action';

export function viewer(state = fromStore.defaultStore.viewer, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
};
export function viewerModel1(state = fromStore.defaultStore.viewerModel1, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER_MODEL_1:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
}
export function viewerModel2(state = fromStore.defaultStore.viewerModel2, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER_MODEL_2:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
}
