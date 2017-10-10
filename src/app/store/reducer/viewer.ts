import { Action } from '@ngrx/store';
import * as fromStore from '../default.store';
import {ViewerAction} from '../action/viewer.action';
/**
 * Reducer pure function which is invoked by an @ngrx action to modify state-like data.
 * @param {Viewer} state - Current state data. 
 * @param {Action} action - @ngrx action which contains the action type to be triggered and
 * its appended data to modify the state data.
 */
export function viewer(state = fromStore.defaultStore.viewer, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
};
/**
 * Reducer pure function which is invoked by an @ngrx action to modify state-like data.
 * @param {ViewerModel} state - Current state data. 
 * @param {Action} action - @ngrx action which contains the action type to be triggered and
 * its appended data to modify the state data.
 */
export function viewerModel1(state = fromStore.defaultStore.viewerModel1, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER_MODEL_1:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
}
/**
 * Reducer pure function which is invoked by an @ngrx action to modify state-like data.
 * @param {ViewerModel} state - Current state data. 
 * @param {Action} action - @ngrx action which contains the action type to be triggered and
 * its appended data to modify the state data.
 */
export function viewerModel2(state = fromStore.defaultStore.viewerModel2, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER_MODEL_2:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
}
