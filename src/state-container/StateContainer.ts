import {Subject} from 'rxjs';
import {
  IStateContainer,
  PureTransitionsToTransitions,
  PureSelectorsToSelectors,
  TransitionDescriptions,
  Values,
  TransitionDescription,
  EnsureTransitionDescription,
} from './types';

const $$observable = (typeof Symbol === 'function' && (Symbol as any).observable) || '@@observable';

export class StateContainer<
  State,
  PureTransitions extends object,
  PureSelectors extends object = {},
  TransitionMap = TransitionDescriptions<PureTransitions>
> implements IStateContainer<State, PureTransitions, PureSelectors> {
  public readonly state$ = new Subject<State>();
  public readonly transition$ = new Subject<Values<TransitionMap>>();

  public reducer = (state, action) => {
    const pureTransition = this.pureTransitions[action.type];
    return pureTransition ? pureTransition(state)(...action.args) : state;
  };

  public readonly transitions = Object.keys(this.pureTransitions).reduce<PureTransitionsToTransitions<PureTransitions>>(
    (acc, type) => ({...acc, [type]: (...args) => this.dispatch({type, args})}),
    {} as PureTransitionsToTransitions<PureTransitions>,
  );

  public readonly selectors = Object.keys(this.pureSelectors).reduce<PureSelectorsToSelectors<PureSelectors>>(
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

  public getState(): State {
    return this.state;
  }

  public replaceReducer(nextReducer) {
    this.reducer = nextReducer;
  }

  public dispatch = (transition) => {
    this.state$.next((this.state = this.reducer(this.state, transition)));
    this.transition$.next(transition);
  };

  public addMiddleware(middleware) {
    this.dispatch = middleware({
      getState: () => this.getState(),
      dispatch: (action) => this.dispatch(action),
    })(this.dispatch);
  }

  public subscribe(listener: (state: State) => void) {
    const subscription = this.state$.subscribe(listener);
    return () => subscription.unsubscribe();
  }

  public take<T extends keyof TransitionMap>(type: T): Promise<TransitionMap[T]> {
    return new Promise((resolve, reject) => {
      const subscription = this.transition$.subscribe((transition) => {
        if ((transition as TransitionDescription<any, any>).type === type) {
          subscription.unsubscribe();
          resolve((transition as unknown) as TransitionMap[T]);
        }
      });
    });
  }

  public async takeArgs<T extends keyof TransitionMap>(
    type: T,
  ): Promise<EnsureTransitionDescription<TransitionMap[T]>['args']> {
    return (((await this.take<T>(type)) as any) as TransitionDescription<any, any>).args;
  }

  public takeFirst<T extends keyof TransitionMap>(...types: T[]): Promise<TransitionMap[T]> {
    return new Promise((resolve, reject) => {
      const subscription = this.transition$.subscribe((transition) => {
        if (types.indexOf((transition as TransitionDescription<any, any>).type) > -1) {
          subscription.unsubscribe();
          resolve((transition as unknown) as TransitionMap[T]);
        }
      });
    });
  }

  public async takeFirstArgs<T extends keyof TransitionMap>(
    ...types: T[]
  ): Promise<EnsureTransitionDescription<TransitionMap[T]>['args']> {
    return (((await this.takeFirst<T>(...types)) as any) as TransitionDescription<any, any>).args;
  }
}

export const createStateContainer = <State, PureTransitions extends object, PureSelectors extends object = {}>(
  state: State,
  pureTransitions: PureTransitions,
  pureSelectors?: PureSelectors,
) => new StateContainer(state, pureTransitions, pureSelectors);
