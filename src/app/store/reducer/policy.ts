import { Action } from '@ngrx/store';
import * as fromStore from '../default.store';
import {PolicyAction} from '../action/policy.action';
/**
 * Reducer pure function which is invoked by an @ngrx action to modify state-like data.
 * @param {PolicyPriority} state - Current state data. 
 * @param {Action} action - @ngrx action which contains the action type to be triggered and
 * its appended data to modify the state data.
 */
export function policy(state = fromStore.defaultStore.policyPriorityList, action: Action) {
    switch (action.type) {
        case PolicyAction.EDIT_POLICY_FIELDS:
            const newEdit = action.payload;
            return Object.assign({}, state, newEdit);
        default:
            return state;
    }
};