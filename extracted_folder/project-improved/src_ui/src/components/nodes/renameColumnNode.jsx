import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function RenameColumnNode(props) {
  return <BaseNode {...props} color="#f97316" defaultLabel="Renomear Coluna" icon={IC.RenameCol} hasTarget={true} hasSource={true} />;
}
