import {TodoState, TodoActions} from './types';
import {StateContainer, createStateContainerReactHelpers} from '../../src';

export const defaultState: TodoState = [
  {
    id: 0,
    text: 'Learning state containers',
    completed: false,
  }
];

export const pureTransitions: TodoActions = {
  add: state => todo => [...state, todo],
  edit: state => todo => state.map(item => item.id === todo.id ? {...item, ...todo} : item),
  delete: state => id => state.filter(item => item.id !== id),
  complete: state => id => state.map(item => item.id === id ? {...item, completed: true} : item),
  completeAll: state => () => state.map(item => ({...item, completed: true})),
  clearCompleted: state => () => state.filter(({completed}) => !completed),
};

export const createStore = () => new StateContainer(defaultState, pureTransitions);
export const store = createStore();

export const {Consumer, Provider, connect, context, useContainer, useSelector, useState, useTransitions} = createStateContainerReactHelpers<typeof store>();
