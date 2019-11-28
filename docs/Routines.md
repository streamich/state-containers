# Routines

Routines are like Redux sagas&mdash;*routines* allow you to listen to transitions happening
in your state container and execute side-effects, async actions and trigger new 
transitions.

First you want to define all the services, i.e. side-effects that are available to
your routines. Your routines will not call any functions with side-effects, only
the services you defined.

```ts
const logger = {
  log: (...args) => console.log(...args),
};
const services = {
  logger,
};
```

Now lets define a routine that logs to console every time a new todo is added.

```ts
import {Routine, spawn} from 'state-containers';

export type TodoRoutine = Routine<typeof store, typeof services>;

const logNewTodos: TodoRoutine  = async ({takeArgs, services}) => {
  while (1) {
    const [todo] = await takeArgs('add'); // 'add' is strongly typed
    services.logger.log(todo.id, todo.text);
  }
};
```

Finally, spawn all your routines.

```ts
const routines = {
  logNewTodos
};

spawn(store, routines, services);
```
