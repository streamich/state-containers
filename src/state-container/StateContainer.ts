import {Subject} from 'rxjs';
import {IStateContainer, PureTransitionsToTransitions} from './types';

const $$observable = (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable';

export class StateContainer<State, PureTransitions extends object> implements IStateContainer<State, PureTransitions> {
  public state$ = new Subject<State>();
  
  public reducer = (state, action) => {
    const pureTransition = this.pureTransitions[action.type];
    return pureTransition ? pureTransition(state)(...action.args) : state;
  };
  
  public transitions = Object.keys(this.pureTransitions).reduce<PureTransitionsToTransitions<PureTransitions>>(
    (acc, type) => ({...acc, [type]: (...args) => this.dispatch({type, args})}),
    {} as PureTransitionsToTransitions<PureTransitions>,
  );
    
  constructor (public state: State, private readonly pureTransitions: PureTransitions) {
    this[$$observable] = this.state$;
  }

  get(): State {
    return this.state;
  }

  getState(): State {
    return this.state;
  }

  replaceReducer(nextReducer) {
    this.reducer = nextReducer;
  }

  dispatch = (action) => {
    this.state$.next(this.state = this.reducer(this.state, action));
  }

  addMiddleware(middleware) {
    this.dispatch = middleware({
      getState: () => this.getState(),
    })(this.dispatch);
  }

  subscribe(listener: (state: State) => void) {
    const subscription = this.state$.subscribe(listener);
    return () => subscription.unsubscribe();
  }
}

export const createStateContainer = <State, PureTransitions extends object>(state: State, pureTransitions: PureTransitions) =>
  new StateContainer(state, pureTransitions);
