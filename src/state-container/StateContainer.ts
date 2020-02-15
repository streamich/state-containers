import {Subject} from 'rxjs';
import {IStateContainer, PureTransitionsToTransitions, PureSelectorsToSelectors} from './types';

const $$observable = (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable';

export class StateContainer<State, PureTransitions extends object, PureSelectors extends object = {}>
  implements IStateContainer<State, PureTransitions, PureSelectors> {
  public state$ = new Subject<State>();

  public reducer = (state, action) => {
    const pureTransition = this.pureTransitions[action.type];
    return pureTransition ? pureTransition(state)(...action.args) : state;
  };

  public transitions = Object.keys(this.pureTransitions).reduce<PureTransitionsToTransitions<PureTransitions>>(
    (acc, type) => ({...acc, [type]: (...args) => this.dispatch({type, args})}),
    {} as PureTransitionsToTransitions<PureTransitions>,
  );

  public selectors = Object.keys(this.pureSelectors).reduce<PureSelectorsToSelectors<PureSelectors>>(
    (acc, selector) => ({
      ...acc,
      [selector]: (...args: any) => (this.pureSelectors as any)[selector](this.state)(...args),
    }),
    {} as PureSelectorsToSelectors<PureSelectors>,
  );

  constructor(
    public state: State,
    private readonly pureTransitions: PureTransitions,
    private readonly pureSelectors: PureSelectors = {} as PureSelectors,
  ) {
    this[$$observable] = this.state$;
  }

  getState(): State {
    return this.state;
  }

  replaceReducer(nextReducer) {
    this.reducer = nextReducer;
  }

  dispatch = (action) => {
    this.state$.next((this.state = this.reducer(this.state, action)));
  };

  addMiddleware(middleware) {
    this.dispatch = middleware({
      getState: () => this.getState(),
      dispatch: (action) => this.dispatch(action),
    })(this.dispatch);
  }

  subscribe(listener: (state: State) => void) {
    const subscription = this.state$.subscribe(listener);
    return () => subscription.unsubscribe();
  }
}

export const createStateContainer = <State, PureTransitions extends object, PureSelectors extends object = {}>(
  state: State,
  pureTransitions: PureTransitions,
  pureSelectors?: PureSelectors,
) => new StateContainer(state, pureTransitions, pureSelectors);
