import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function WithColumnNode(props) {
  return <BaseNode {...props} color="#8b5cf6" defaultLabel="Criar Coluna" icon={IC.WithColumn} hasTarget={true} hasSource={true} />;
}
