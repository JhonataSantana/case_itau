import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function FilterNode(props) {
  return <BaseNode {...props} color="#f59e0b" defaultLabel="Filtrar Linhas" icon={IC.Filter} hasTarget={true} hasSource={true} />;
}
