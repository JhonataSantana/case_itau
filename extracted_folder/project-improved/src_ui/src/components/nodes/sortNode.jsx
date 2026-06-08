import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function SortNode(props) {
  return <BaseNode {...props} color="#14b8a6" defaultLabel="Ordenar" icon={IC.Sort} hasTarget={true} hasSource={true} />;
}
