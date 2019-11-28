import {Subject} from 'rxjs';
import {StateContainer, PureTransitionsToTransitions} from './types';

const $$observable = (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable';

export const createStateContainer = <State, PureTransitions extends object>(
  defaultState: State,
  pureTransitions: PureTransitions,
): StateContainer<State, PureTransitions> => {
  const state$ = new Subject<State>();
  const container: StateContainer<State, PureTransitions> = {
    state: defaultState,
    getState: () => container.state,
    state$,
    reducer: (state, action) => {
      const pureTransition = pureTransitions[action.type];
      return pureTransition ? pureTransition(state)(...action.args) : state;
    },
    replaceReducer: nextReducer => (container.reducer = nextReducer),
    dispatch: action => state$.next((container.state = container.reducer(container.state, action))),
    transitions: Object.keys(pureTransitions).reduce<PureTransitionsToTransitions<PureTransitions>>(
      (acc, type) => ({...acc, [type]: (...args) => container.dispatch({type, args})}),
      {} as PureTransitionsToTransitions<PureTransitions>,
    ),
    addMiddleware: middleware => (container.dispatch = middleware(container)(container.dispatch)),
    subscribe: (listener: (state: State) => void) => {
      const subscription = state$.subscribe(listener);
      return () => subscription.unsubscribe();
    },
    [$$observable]: state$,
  };
  return container;
};
