import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function UnionNode(props) {
  return <BaseNode {...props} color="#6366f1" defaultLabel="União de Bases" icon={IC.Union} hasTarget={true} hasSource={true} />;
}
