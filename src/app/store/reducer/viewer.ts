import { Action } from '@ngrx/store';
import * as fromStore from '../default.store';
import {ViewerAction} from '../action/viewer.action';

export function viewer(state = fromStore.defaultStore.viewer, action: Action) {
    switch (action.type) {
        case ViewerAction.EDIT_VIEWER:
            const newEdit = action.payload;
            return {...state, ...newEdit};
    }
};
