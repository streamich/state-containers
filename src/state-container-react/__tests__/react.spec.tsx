import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {act, Simulate} from 'react-dom/test-utils';
import {StateContainer} from '../../state-container';
import {createStateContainerReactHelpers} from '..';

const create = <S, T extends object>(state: S, transitions: T = {} as T) => {
  const pureTransitions = {
    set: (state) => (newState) => newState,
    ...transitions,
  };
  const store = new StateContainer<typeof state, typeof pureTransitions>(state, pureTransitions);
  return {store, mutators: store.transitions};
};

let container: HTMLDivElement | null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container!);
  container = null;
});

test('can create React context', () => {
  const context = createStateContainerReactHelpers();

  expect(context).toMatchObject({
    Provider: expect.any(Object),
    Consumer: expect.any(Object),
    connect: expect.any(Function),
    context: expect.any(Object),
  });
});

test('<Provider> passes state to <Consumer>', () => {
  const {store} = create({hello: 'world'});
  const {Provider, Consumer} = createStateContainerReactHelpers<typeof store>();

  ReactDOM.render(
    <Provider value={store}>
      <Consumer>{(store) => store.state.hello}</Consumer>
    </Provider>,
    container,
  );

  expect(container!.innerHTML).toBe('world');
});

interface State1 {
  hello: string;
}

interface Props1 {
  message: string;
  stop: '.' | '!' | '?';
}

test('<Provider> passes state to connect()()', () => {
  const {store} = create({hello: 'Bob'});
  const {Provider, connect} = createStateContainerReactHelpers();

  const Demo: React.FC<Props1> = ({message, stop}) => (
    <>
      {message}
      {stop}
    </>
  );
  const mergeProps = ({hello}: State1) => ({message: hello});
  const DemoConnected = connect<Props1, 'message'>(mergeProps)(Demo);

  ReactDOM.render(
    <Provider value={store}>
      <DemoConnected stop="?" />
    </Provider>,
    container,
  );

  expect(container!.innerHTML).toBe('Bob?');
});

test('context receives Redux store', () => {
  const {store} = create({foo: 'bar'});
  const {Provider, context} = createStateContainerReactHelpers<typeof store>();

  ReactDOM.render(
    /* eslint-disable no-shadow */
    <Provider value={store}>
      <context.Consumer>{(store) => store.state.foo}</context.Consumer>
    </Provider>,
    /* eslint-enable no-shadow */
    container,
  );

  expect(container!.innerHTML).toBe('bar');
});

xtest('can use multiple stores in one React app', () => {});

describe('hooks', () => {
  describe('useStore', () => {
    test('can select store using useStore hook', () => {
      const {store} = create({foo: 'bar'});
      const {Provider, useContainer} = createStateContainerReactHelpers<typeof store>();
      const Demo: React.FC<{}> = () => {
        // eslint-disable-next-line no-shadow
        const store = useContainer();
        return <>{store.state.foo}</>;
      };

      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      expect(container!.innerHTML).toBe('bar');
    });
  });

  describe('useState', () => {
    test('can select state using useState hook', () => {
      const {store} = create({foo: 'qux'});
      const {Provider, useState} = createStateContainerReactHelpers<typeof store>();
      const Demo: React.FC<{}> = () => {
        const {foo} = useState();
        return <>{foo}</>;
      };

      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      expect(container!.innerHTML).toBe('qux');
    });

    test('re-renders when state changes', () => {
      const {
        store,
        mutators: {setFoo},
      } = create(
        {foo: 'bar'},
        {
          setFoo: (state) => (foo) => ({...state, foo}),
        },
      );
      const {Provider, useState} = createStateContainerReactHelpers<typeof store>();
      const Demo: React.FC<{}> = () => {
        const {foo} = useState();
        return <>{foo}</>;
      };

      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      expect(container!.innerHTML).toBe('bar');
      act(() => {
        setFoo('baz');
      });
      expect(container!.innerHTML).toBe('baz');
    });
  });

  describe('useMutations', () => {
    test('useMutations hook returns mutations that can update state', () => {
      const {store} = create<
        {
          cnt: number;
        },
        any
      >(
        {
          cnt: 0,
        },
        {
          increment: (state) => (value) => ({...state, cnt: state.cnt + value}),
        },
      );

      const {Provider, useState, useTransitions} = createStateContainerReactHelpers<typeof store>();
      const Demo: React.FC<{}> = () => {
        const {cnt} = useState();
        const {increment} = useTransitions();
        return (
          <>
            <strong>{cnt}</strong>
            <button onClick={() => increment(10)}>Increment</button>
          </>
        );
      };

      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      expect(container!.querySelector('strong')!.innerHTML).toBe('0');
      act(() => {
        Simulate.click(container!.querySelector('button')!, {});
      });
      expect(container!.querySelector('strong')!.innerHTML).toBe('10');
      act(() => {
        Simulate.click(container!.querySelector('button')!, {});
      });
      expect(container!.querySelector('strong')!.innerHTML).toBe('20');
    });
  });

  describe('useSelector', () => {
    test('can select deeply nested value', () => {
      const {store} = create({
        foo: {
          bar: {
            baz: 'qux',
          },
        },
      });
      const selector = (state: {foo: {bar: {baz: string}}}) => state.foo.bar.baz;
      const {Provider, useSelector} = createStateContainerReactHelpers<typeof store>();
      const Demo: React.FC<{}> = () => {
        const value = useSelector(selector);
        return <>{value}</>;
      };

      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      expect(container!.innerHTML).toBe('qux');
    });

    test('re-renders when state changes', () => {
      const {store, mutators} = create({
        foo: {
          bar: {
            baz: 'qux',
          },
        },
      });
      const selector = (state: {foo: {bar: {baz: string}}}) => state.foo.bar.baz;
      const {Provider, useSelector} = createStateContainerReactHelpers();
      const Demo: React.FC<{}> = () => {
        const value = useSelector(selector);
        return <>{value}</>;
      };

      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      expect(container!.innerHTML).toBe('qux');
      act(() => {
        mutators.set({
          foo: {
            bar: {
              baz: 'quux',
            },
          },
        });
      });
      expect(container!.innerHTML).toBe('quux');
    });

    test("re-renders only when selector's result changes", async () => {
      const {store, mutators} = create({a: 'b', foo: 'bar'});
      const selector = (state: {foo: string}) => state.foo;
      const {Provider, useSelector} = createStateContainerReactHelpers<typeof store>();

      let cnt = 0;
      const Demo: React.FC<{}> = () => {
        cnt++;
        const value = useSelector(selector);
        return <>{value}</>;
      };
      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(1);

      act(() => {
        mutators.set({a: 'c', foo: 'bar'});
      });

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(1);

      act(() => {
        mutators.set({a: 'd', foo: 'bar 2'});
      });

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(2);
    });

    test('does not re-render on same shape object', async () => {
      const {store, mutators} = create({foo: {bar: 'baz'}});
      const selector = (state: {foo: any}) => state.foo;
      const {Provider, useSelector} = createStateContainerReactHelpers<typeof store>();

      let cnt = 0;
      const Demo: React.FC<{}> = () => {
        cnt++;
        const value = useSelector(selector);
        return <>{JSON.stringify(value)}</>;
      };
      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(1);

      act(() => {
        mutators.set({foo: {bar: 'baz'}});
      });

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(1);

      act(() => {
        mutators.set({foo: {bar: 'qux'}});
      });

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(2);
    });

    test('can set custom comparator function to prevent re-renders on deep equality', async () => {
      const {store, mutators} = create(
        {foo: {bar: 'baz'}},
        {
          set: (state) => (newState) => newState,
        },
      );
      const selector = (state: {foo: any}) => state.foo;
      const comparator = (prev: any, curr: any) => JSON.stringify(prev) === JSON.stringify(curr);
      const {Provider, useSelector} = createStateContainerReactHelpers<typeof store>();

      let cnt = 0;
      const Demo: React.FC<{}> = () => {
        cnt++;
        const value = useSelector(selector, comparator);
        return <>{JSON.stringify(value)}</>;
      };
      ReactDOM.render(
        <Provider value={store}>
          <Demo />
        </Provider>,
        container,
      );

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(1);

      act(() => {
        mutators.set({foo: {bar: 'baz'}});
      });

      await new Promise((r) => setTimeout(r, 1));
      expect(cnt).toBe(1);
    });

    xtest('unsubscribes when React un-mounts', () => {});
  });
});
