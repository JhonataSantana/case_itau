import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';

const LEFT_HANDLES = [
  { id: 'left_table',  style: { top: '33%' }, label: 'A', labelStyle: { color: '#94a3b8' } },
  { id: 'right_table', style: { top: '67%' }, label: 'B', labelStyle: { color: '#94a3b8' } },
];

export default function JoinNode(props) {
  return (
    <BaseNode
      {...props}
      color="#0ea5e9"
      defaultLabel="Junção de Bases"
      icon={IC.Join}
      hasTarget={false}
      targetHandles={LEFT_HANDLES}
    />
  );
}
