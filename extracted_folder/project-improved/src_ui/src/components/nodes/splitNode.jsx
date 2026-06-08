import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';

const RIGHT_HANDLES = [
  { id: 'true_path',  style: { top: '33%', background: '#10b981' }, label: 'T', labelStyle: { color: '#10b981' } },
  { id: 'false_path', style: { top: '67%', background: '#ef4444' }, label: 'F', labelStyle: { color: '#ef4444' } },
];

export default function SplitNode(props) {
  return (
    <BaseNode
      {...props}
      color="#e879f9"
      defaultLabel="Bifurcação"
      icon={IC.Split}
      hasSource={false}
      sourceHandles={RIGHT_HANDLES}
    />
  );
}
