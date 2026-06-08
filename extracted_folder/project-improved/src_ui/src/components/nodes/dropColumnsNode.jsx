import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function DropColumnsNode(props) {
  return <BaseNode {...props} color="#ef4444" defaultLabel="Remover Colunas" icon={IC.DropCol} hasTarget={true} hasSource={true} />;
}
