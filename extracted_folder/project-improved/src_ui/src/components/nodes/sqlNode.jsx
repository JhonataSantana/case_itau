import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function SqlNode(props) {
  return <BaseNode {...props} color="#64748b" defaultLabel="SQL Customizado" icon={IC.SQL} hasTarget={true} hasSource={true} />;
}
