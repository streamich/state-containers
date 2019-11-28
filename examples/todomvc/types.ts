import {StateContainer, PureTransition} from '../../src';

export interface TodoItem {
  text: string;
  completed: boolean;
  id: number;
}

export type TodoState = TodoItem[];

export interface TodoActions {
  add: PureTransition<TodoState, [TodoItem]>;
  edit: PureTransition<TodoState, [TodoItem]>;
  delete: PureTransition<TodoState, [number]>;
  complete: PureTransition<TodoState, [number]>;
  completeAll: PureTransition<TodoState, []>;
  clearCompleted: PureTransition<TodoState, []>;
}

export type TodoStateContainer = StateContainer<TodoState, TodoActions>;
