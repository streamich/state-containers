import {Spawner, Take, TakeRace, TakeArgs, TakeArgsRace, Routine} from './types';
import {StateContainer, TransitionDescription, UnboxTransitions, Ensure} from '../state-container/types';
import {Subject} from 'rxjs';

export const createSpawner = <
  Container extends StateContainer<any, any>,
  Services extends object = any,
  ActionType extends string = Ensure<keyof UnboxTransitions<Container>, string>
>(
  container: Container,
  services: Services,
): Spawner<Container, Services> => {
  const action$ = new Subject<TransitionDescription>();
  container.addMiddleware(() => dispatch => action => {
    const result = dispatch(action);
    action$.next(action);
    return result;
  });

  const take: Take<ActionType> = <Type extends string = ActionType>(type: Type): Promise<TransitionDescription<Type>> =>
    new Promise<TransitionDescription<Type>>((resolve, reject) => {
      const subscription = action$.subscribe(action => {
        if (((action.type as unknown) as Type) === type) {
          subscription.unsubscribe();
          resolve((action as unknown) as TransitionDescription<Type>);
        }
      });
    });

  const takeFirst: TakeRace<ActionType> = <Type extends string = ActionType>(...types: Type[]) =>
    new Promise<TransitionDescription<Type>>((resolve, reject) => {
      const subscription = action$.subscribe(action => {
        if (types.indexOf((action.type as unknown) as Type) > -1) {
          subscription.unsubscribe();
          resolve((action as unknown) as TransitionDescription<Type>);
        }
      });
    });

  const takeArgs: TakeArgs<ActionType> = async <Type extends string = ActionType>(
    type: Type,
  ): Promise<TransitionDescription<Type>['args']> => (await take<Type>(type)).args;

  const takeArgsFirst: TakeArgsRace<ActionType> = async <Type extends string = ActionType>(...types: Type[]) =>
    (await takeFirst(...types)).args;

  const spawner: Spawner<Container, Services> = async (name, routine) => {
    try {
      await routine({
        container,
        services,
        action$,
        take,
        takeRace: takeFirst,
        takeArgs,
        takeArgsRace: takeArgsFirst,
      });
    } catch (error) {
      // tslint:disable-next-line
      console.log(`Routine "${name}" crashed.`);
      // tslint:disable-next-line
      console.error(error);
    }
  };

  return spawner;
};

export const spawn = <
  Container extends StateContainer<any, any>,
  Routines extends Record<string, Routine<Container, Services>>,
  Services extends object = any
>(
  container: Container,
  routines: Routines,
  services: Services,
) => {
  const spawner = createSpawner(container, services);
  for (const [name, routine] of Object.entries(routines)) spawner(name, routine);
};
