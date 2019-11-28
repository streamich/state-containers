import * as React from 'react';

export type Selector<State, Result> = (state: State) => Result;
export type Comparator<Result> = (previous: Result, current: Result) => boolean;

export type MapStateToProps<State, StateProps extends {}> = Selector<State, StateProps>;

export type Connect<State extends {}> = <Props extends {}, StatePropKeys extends keyof Props>(
  mapStateToProp: MapStateToProps<State, Pick<Props, StatePropKeys>>,
) => (component: React.ComponentType<Props>) => React.FC<Omit<Props, StatePropKeys>>;
