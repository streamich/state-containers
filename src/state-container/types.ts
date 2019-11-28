import {Observable} from 'rxjs';

export type Ensure<T, X> = T extends X ? T : never;
export type EnsureFunction<F> = Ensure<F, (...args: any) => any>;

export interface TransitionDescription<Type extends string = string, Args extends any[] = any[]> {
  type: Type;
  args: Args;
}
export type Transition<State, Args extends any[]> = (...args: Args) => State;
export type PureTransition<State, Args extends any[]> = (state: State) => Transition<State, Args>;
export type EnsurePureTransition<T> = Ensure<T, PureTransition<any, any>>;
export type PureTransitionToTransition<T extends PureTransition<any, any>> = ReturnType<T>;
export type PureTransitionsToTransitions<T extends object> = {
  [K in keyof T]: PureTransitionToTransition<EnsurePureTransition<T[K]>>
};

export interface StateContainer<State, PureTransitions extends object> {
  state: State;
  getState: () => State;
  state$: Observable<State>;
  reducer: Reducer<State>;
  replaceReducer: (nextReducer: Reducer<State>) => void;
  dispatch: (action: TransitionDescription) => void;
  transitions: PureTransitionsToTransitions<PureTransitions>;
  addMiddleware: (middleware: Middleware<State>) => void;
  subscribe: (listener: (state: State) => void) => () => void;
}

export type Dispatch<T> = (action: T) => void;

export type Middleware<State = any> = (
  store: Pick<StateContainer<State, any>, 'getState' | 'dispatch'>,
) => (next: (action: TransitionDescription) => TransitionDescription | any) => Dispatch<TransitionDescription>;

export type Reducer<State> = (state: State, action: TransitionDescription) => State;

export type UnboxState<Container extends StateContainer<any, any>> = Container extends StateContainer<infer T, any>
  ? T
  : never;
export type UnboxTransitions<Container extends StateContainer<any, any>> = Container extends StateContainer<
  any,
  infer T
>
  ? T
  : never;
