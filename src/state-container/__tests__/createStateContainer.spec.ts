import {StateContainer, createStateContainer} from '../StateContainer';
import {first, take} from 'rxjs/operators';

const create = <S, T extends object>(state: S, transitions: T = {} as T) => {
  const pureTransitions = {
    set: (state) => (newState) => newState,
    ...transitions,
  };
  const store = new StateContainer<typeof state, typeof pureTransitions>(state, pureTransitions);
  return {store, mutators: store.transitions};
};

test('can set default state', () => {
  const defaultState = {
    foo: 'bar',
  };
  const {store} = create(defaultState);
  expect(store.state).toEqual(defaultState);
  expect(store.getState()).toEqual(defaultState);
});

test('can set state', () => {
  const defaultState = {
    foo: 'bar',
  };
  const newState = {
    foo: 'baz',
  };
  const {store, mutators} = create(defaultState);

  mutators.set(newState);

  expect(store.state).toEqual(newState);
  expect(store.getState()).toEqual(newState);
});

test('does not shallow merge states', () => {
  const defaultState = {
    foo: 'bar',
  };
  const newState = {
    foo2: 'baz',
  };
  const {store, mutators} = create(defaultState);

  mutators.set(newState);

  expect(store.state).toEqual(newState);
  expect(store.getState()).toEqual(newState);
});

test('can subscribe and unsubscribe to state changes', () => {
  const {store, mutators} = create({});
  const spy = jest.fn();
  const subscription = store.state$.subscribe(spy);
  mutators.set({a: 1});
  mutators.set({a: 2});
  subscription.unsubscribe();
  mutators.set({a: 3});

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy.mock.calls[0][0]).toEqual({a: 1});
  expect(spy.mock.calls[1][0]).toEqual({a: 2});
});

test('multiple subscribers can subscribe', () => {
  const {store, mutators} = create({});
  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const subscription1 = store.state$.subscribe(spy1);
  const subscription2 = store.state$.subscribe(spy2);
  mutators.set({a: 1});
  subscription1.unsubscribe();
  mutators.set({a: 2});
  subscription2.unsubscribe();
  mutators.set({a: 3});

  expect(spy1).toHaveBeenCalledTimes(1);
  expect(spy2).toHaveBeenCalledTimes(2);
  expect(spy1.mock.calls[0][0]).toEqual({a: 1});
  expect(spy2.mock.calls[0][0]).toEqual({a: 1});
  expect(spy2.mock.calls[1][0]).toEqual({a: 2});
});

test('creates impure mutators from pure mutators', () => {
  const {store, mutators} = create(
    {},
    {
      setFoo: (_) => (bar) => ({foo: bar}),
    },
  );

  expect(typeof mutators.setFoo).toBe('function');
});

test('mutators can update state', () => {
  const {store, mutators} = create(
    {
      value: 0,
      foo: 'bar',
    },
    {
      add: (state) => (increment) => ({...state, value: state.value + increment}),
      setFoo: (state) => (bar) => ({...state, foo: bar}),
    },
  );

  expect(store.state).toEqual({
    value: 0,
    foo: 'bar',
  });

  mutators.add(11);
  mutators.setFoo('baz');

  expect(store.state).toEqual({
    value: 11,
    foo: 'baz',
  });

  mutators.add(-20);
  mutators.setFoo('bazooka');

  expect(store.state).toEqual({
    value: -9,
    foo: 'bazooka',
  });
});

test('mutators methods are not bound', () => {
  const {store, mutators} = create(
    {value: -3},
    {
      add: (state) => (increment) => ({...state, value: state.value + increment}),
    },
  );

  expect(store.state).toEqual({value: -3});
  mutators.add(4);
  expect(store.state).toEqual({value: 1});
});

test('created mutators are saved in store object', () => {
  const {store, mutators} = create(
    {value: -3},
    {
      add: (state) => (increment) => ({...state, value: state.value + increment}),
    },
  );

  expect(typeof store.transitions.add).toBe('function');
  mutators.add(5);
  expect(store.state).toEqual({value: 2});
});

describe('selectors', () => {
  test('can specify no selectors, or can skip them', () => {
    createStateContainer({}, {});
    createStateContainer({}, {}, {});
  });

  test('selector object is available on .selectors key', () => {
    const container1 = createStateContainer({}, {}, {});
    const container2 = createStateContainer({}, {}, {foo: () => () => 123});
    const container3 = createStateContainer({}, {}, {bar: () => () => 1, baz: () => () => 1});

    expect(Object.keys(container1.selectors).sort()).toEqual([]);
    expect(Object.keys(container2.selectors).sort()).toEqual(['foo']);
    expect(Object.keys(container3.selectors).sort()).toEqual(['bar', 'baz']);
  });

  test('selector without arguments returns correct state slice', () => {
    const container = createStateContainer(
      {name: 'Oleg'},
      {
        changeName: (state: {name: string}) => (name: string) => ({...state, name}),
      },
      {getName: (state: {name: string}) => () => state.name},
    );

    expect(container.selectors.getName()).toBe('Oleg');
    container.transitions.changeName('Britney');
    expect(container.selectors.getName()).toBe('Britney');
  });

  test('selector can accept an argument', () => {
    const container = createStateContainer(
      {
        users: {
          1: {
            name: 'Darth',
          },
        },
      },
      {},
      {
        getUser: (state: any) => (id: number) => state.users[id],
      },
    );

    expect(container.selectors.getUser(1)).toEqual({name: 'Darth'});
    expect(container.selectors.getUser(2)).toBe(undefined);
  });

  test('selector can accept multiple arguments', () => {
    const container = createStateContainer(
      {
        users: {
          5: {
            name: 'Darth',
            surname: 'Vader',
          },
        },
      },
      {},
      {
        getName: (state: any) => (id: number, which: 'name' | 'surname') => state.users[id][which],
      },
    );

    expect(container.selectors.getName(5, 'name')).toEqual('Darth');
    expect(container.selectors.getName(5, 'surname')).toEqual('Vader');
  });
});

describe('transition$', () => {
  test('fires on state transitions', () => {
    const container = createStateContainer(
      {name: 'Oleg'},
      {
        changeName: (state: {name: string}) => (name: string) => ({...state, name}),
      },
      {getName: (state: {name: string}) => () => state.name},
    );
    const spy = jest.fn();

    container.transition$.subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(0);
    container.transitions.changeName('lol');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      type: 'changeName',
      args: ['lol'],
    });
    container.transitions.changeName('foo');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({
      type: 'changeName',
      args: ['foo'],
    });
  });
});

describe('take', () => {
  test('gets specified event', async () => {
    const container = createStateContainer(
      {name: 'Oleg'},
      {
        changeName: (state: {name: string}) => (name: string) => ({...state, name}),
        noChange: (state: {name: string}) => () => state,
      },
      {getName: (state: {name: string}) => () => state.name},
    );
    const spy = jest.fn();
    const spyError = jest.fn();

    const promise = container.take('changeName').then(spy, spyError);

    await new Promise((r) => setTimeout(r, 1));
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spyError).toHaveBeenCalledTimes(0);

    container.transitions.noChange();

    await new Promise((r) => setTimeout(r, 1));
    expect(spy).toHaveBeenCalledTimes(0);
    expect(spyError).toHaveBeenCalledTimes(0);

    container.transitions.changeName('foo');

    await new Promise((r) => setTimeout(r, 1));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyError).toHaveBeenCalledTimes(0);

    expect(spy).toHaveBeenCalledWith({
      type: 'changeName',
      args: ['foo'],
    });

    await promise;
  });
});
