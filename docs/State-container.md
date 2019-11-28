# State container

The first thing you need to do is define the state shape of your container. For our, 
TodoMVC example we define the `TodoState` type below.

```ts
export interface TodoItem {
  text: string;
  completed: boolean;
  id: number;
}

export type TodoState = TodoItem[];
```

Then we need to specify the default state.

```ts
export const defaultState: TodoState = [
  {
    id: 0,
    text: 'Learning state containers',
    completed: false,
  }
];
```

Once we know the shape of our state we can define tha state transitions. State transitions
are pure functions in the form `state => ...args => state`, they receive `state` and any `...args`
and have to return `state` again.

For our TodoMVC we define basic todo list management transitions.

```ts
import {PureTransition} from 'state-containers';

export interface TodoPureTransitions {
  add: PureTransition<TodoState, [TodoItem]>;
  edit: PureTransition<TodoState, [TodoItem]>;
  delete: PureTransition<TodoState, [number]>;
  complete: PureTransition<TodoState, [number]>;
  completeAll: PureTransition<TodoState, []>;
  clearCompleted: PureTransition<TodoState, []>;
}
```

And implement them.

```ts
export const pureTransitions: TodoPureTransitions = {
  add: state => todo => [...state, todo],
  edit: state => todo => state.map(item => item.id === todo.id ? {...item, ...todo} : item),
  delete: state => id => state.filter(item => item.id !== id),
  complete: state => id => state.map(item => item.id === id ? {...item, completed: true} : item),
  completeAll: state => () => state.map(item => ({...item, completed: true})),
  clearCompleted: state => () => state.filter(({completed}) => !completed),
};
```

Now we have everything to create our state container, so let's make one.

```ts
import {createStateContainer} from 'state-containers';
const store = createStateContainer(defaultState, pureTransitions);
```

We can always get the current state of our state container.

```ts
store.state
store.getState()
```

We can also subscribe to all state changes.

```ts
store.state$.subscribe(newState => {
  // ...
}));
```

All the transitions we defined are available as TypeScript strongly typed functions.

```ts
store.transitions.add({
  id: 1,
  text: 'Learn to test state containers',
  completed: false,
});

store.transitions.delete(1);
```

Finally, the state container you created is fully Redux compatible and has the following methods.

```ts
store.getState()
store.dispatch()
store.replaceReducer()
store.subscribe()
store.addMiddleware()
```
