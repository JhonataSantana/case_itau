import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function InputNode(props) {
  return <BaseNode {...props} color="#3b82f6" defaultLabel="Ler Base" icon={IC.Input} hasTarget={false} hasSource={true} />;
}
