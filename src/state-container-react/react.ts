import * as React from 'react';
import useObservable from 'react-use/lib/useObservable';
import {Comparator, Connect} from './types';
import defaultComparator from 'fast-deep-equal';
import {IStateContainer, UnboxState} from '../state-container';

const {useContext, useLayoutEffect, useRef, createElement: h} = React;

export const createStateContainerReactHelpers = <Container extends IStateContainer<any, any>>() => {
  const context = React.createContext<Container>(null);

  const useContainer = (): Container => useContext(context);

  const useState = (): UnboxState<Container> => {
    const {state$, state} = useContainer();
    const value = useObservable(state$, state);
    return value;
  };

  const useTransitions = () => useContainer().transitions;

  const useSelector = <Result>(
    selector: (state: UnboxState<Container>) => Result,
    comparator: Comparator<Result> = defaultComparator,
  ): Result => {
    const {state$, state} = useContainer();
    const lastValueRef = useRef<Result>(undefined);
    const [value, setValue] = React.useState<Result>(() => {
      const newValue = selector(state);
      lastValueRef.current = newValue;
      return newValue;
    });
    useLayoutEffect(
      () => {
        const subscription = state$.subscribe(state => {
          const newValue = selector(state);
          if (!comparator(lastValueRef.current, newValue)) {
            lastValueRef.current = newValue;
            setValue(newValue);
          }
        });
        return () => subscription.unsubscribe();
      },
      [state$, comparator],
    );
    return value;
  };

  const connect: Connect<UnboxState<Container>> = mapStateToProp => component => props =>
    h(component, {...useSelector(mapStateToProp), ...props} as any);

  return {
    Provider: context.Provider,
    Consumer: context.Consumer,
    context,
    useContainer,
    useState,
    useTransitions,
    useSelector,
    connect,
  };
};
