import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function OutputNode(props) {
  return <BaseNode {...props} color="#10b981" defaultLabel="Exportar" icon={IC.Output} hasTarget={true} hasSource={false} />;
}
