import {createStore, defaultState} from '../store';

test('has correct default state', () => {
  const store = createStore();
  expect(store.state).toEqual(defaultState);
});

test('can add a todo item', () => {
  const store = createStore();
  store.transitions.add({
    id: 1,
    text: 'Learn to test state containers',
    completed: false,
  });
  expect(store.state).toMatchInlineSnapshot(`
    Array [
      Object {
        "completed": false,
        "id": 0,
        "text": "Learning state containers",
      },
      Object {
        "completed": false,
        "id": 1,
        "text": "Learn to test state containers",
      },
    ]
  `);
});
