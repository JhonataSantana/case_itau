import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function SelectColumnsNode(props) {
  return <BaseNode {...props} color="#06b6d4" defaultLabel="Selecionar Col." icon={IC.SelectCol} hasTarget={true} hasSource={true} />;
}
