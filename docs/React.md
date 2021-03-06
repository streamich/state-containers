# React

State containers are especially easy to use with React. Let's say you have a state container
created named `store`. You can create all necessary React helpers for your
app in `react.ts` file somewhere in your project.

```ts
// react.ts
import {createStateContainerReactHelpers} from 'state-containers';

export const {
  Consumer,
  Provider,
  connect,
  context,
  useContainer,
  useSelector,
  useState,
  useTransitions
} = createStateContainerReactHelpers<typeof store>();
```

Wrap your React app in the provider.

```tsx
<Provider value={store}>
  <MyApplication />
</Provider>
```

Now everywhere in your React app you can use `connect` HOC and `useContainer`, `useSelector`,
`useState`, `useTransitions` hooks.

```tsx
import {useSelector, useTransitions} from './react';

const firstTodoSelector = state => state[0];
const useFirstTodo = () => useSelector(firstTodoSelector);

const Demo = () => {
  const firstTodo = useFirstTodo();
  const transitions = useTransitions();

  return (
    <div>
      First todo: {firstTodo.text}
      <button onClick={() => transitions.completeAll()}>Complete all todos</button>
    </div>
  );
};
```
