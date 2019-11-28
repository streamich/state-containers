import {StateContainer, PureTransition, createStateContainer} from '../../src';

type CounterState = number;

interface CounterPureTransitions {
  increment: PureTransition<CounterState, [number]>;
  double: PureTransition<CounterState, []>;
  setTo: PureTransition<CounterState, [number]>;
}

const defaultState: CounterState = 0;

const pureTransitions: CounterPureTransitions = {
  increment: cnt => by => cnt + by,
  double: cnt => () => 2 * cnt,
  setTo: ctn => to => to,
};

const store = createStateContainer(defaultState, pureTransitions);

store.transitions.increment(5);
store.transitions.double();
store.state; // 10
