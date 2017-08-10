import { Action } from '@ngrx/store';
import * as fromStore from '../default.store';
import {PolicyAction} from '../action/policy.action';

export function policy(state = fromStore.defaultStore.policyPriorityList, action: Action) {
    switch (action.type) {
        case PolicyAction.EDIT_POLICY_FIELDS:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
};