import {Observable} from 'rxjs';
import {IStateContainer, TransitionDescription, Ensure, UnboxTransitions} from '../state-container/types';

export type Take<T extends string> = <Type extends string = T>(
  actionType: Type,
) => Promise<TransitionDescription<Type>>;
export type TakeRace<T extends string> = <Type extends string = T>(
  ...actionTypes: Type[]
) => Promise<TransitionDescription<Type>>;
export type TakeArgs<T extends string> = <Type extends string = T>(
  actionType: Type,
) => Promise<TransitionDescription<Type>['args']>;
export type TakeArgsRace<T extends string> = <Type extends string = T>(
  ...actionTypes: Type[]
) => Promise<TransitionDescription<Type>['args']>;

export interface RoutineParams<Container extends IStateContainer<any, any>, Services extends object = any> {
  container: Container;

  /**
   * A map of side-effects that routine is allowed to perform.
   */
  services: Services;

  /**
   * Observable that emits all dispatched actions.
   */
  action$: Observable<TransitionDescription>;

  /**
   * Wait for the first action with given action type.
   */
  take: Take<Ensure<keyof UnboxTransitions<Container>, string>>;

  /**
   * Wait for multiple actions and receive the first one that matches action type.
   */
  takeRace: TakeRace<Ensure<keyof UnboxTransitions<Container>, string>>;

  /**
   * Same as `take` but returns only arguments.
   */
  takeArgs: TakeArgs<Ensure<keyof UnboxTransitions<Container>, string>>;

  /**
   * Same as `takeArgs` but returns only arguments.
   */
  takeArgsRace: TakeArgsRace<Ensure<keyof UnboxTransitions<Container>, string>>;
}

export type Routine<Container extends IStateContainer<any, any>, Services extends object = any> = (
  params: RoutineParams<Container, Services>,
) => void;

export type Spawner<Container extends IStateContainer<any, any>, Services extends object = any> = (
  name: string,
  routine: Routine<Container, Services>,
) => void;

export type Spawn<
  Container extends IStateContainer<any, any>,
  Routines extends object,
  Services extends object = any
> = (container: Container, routines: Routines, services: Services) => void;
