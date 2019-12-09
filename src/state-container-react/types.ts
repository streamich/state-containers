import * as React from 'react';

export type Comparator<Result> = (previous: Result, current: Result) => boolean;

export type MapStateToProps<State, StateProps extends object> = (state: State) => StateProps;
  export type Connect<State> = <Props extends object, StatePropKeys extends keyof Props>(
    mapStateToProp: MapStateToProps<State, Pick<Props, StatePropKeys>>
  ) => (component: React.ComponentType<Props>) => React.FC<Omit<Props, StatePropKeys>>;
