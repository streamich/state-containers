import {createStateContainer} from '../createStateContainer';

const create = <S, T extends object>(state: S, transitions: T = {} as T) => {
  const pureTransitions = {
    set: state => newState => newState,
    ...transitions,
  };
  const store = createStateContainer<typeof state, typeof pureTransitions>(state, pureTransitions);
  return {store, mutators: store.transitions};
};

test('can create store', () => {
  const {store} = create({});
  expect(store).toMatchObject({
    state: expect.any(Object),
    getState: expect.any(Function),
    state$: expect.any(Object),
    transitions: expect.any(Object),
    dispatch: expect.any(Function),
    subscribe: expect.any(Function),
    replaceReducer: expect.any(Function),
    addMiddleware: expect.any(Function),
  });
});

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
      setFoo: _ => bar => ({foo: bar}),
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
      add: state => increment => ({...state, value: state.value + increment}),
      setFoo: state => bar => ({...state, foo: bar}),
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
      add: state => increment => ({...state, value: state.value + increment}),
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
      add: state => increment => ({...state, value: state.value + increment}),
    },
  );

  expect(typeof store.transitions.add).toBe('function');
  mutators.add(5);
  expect(store.state).toEqual({value: 2});
});
