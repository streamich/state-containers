# state-containers

- Strongly typed state containers with TypeScript.
- Redux-like but without the boilerplate.
- Simple state management for your services and React apps.


## Usage

Install:

```
npm install state-containers
```

Use (TodoMVC example):

```ts
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
```


## Reference

- [State container](./docs/State-container.md)
- [React](./docs/React.md)
- Routines


## Examples

- [Counter](./examples/counter)
- [TodoMVC](./examples/todomvc)


## License

[Unlicense](LICENSE) &mdash; public domain.
