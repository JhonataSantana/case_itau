import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function DedupNode(props) {
  return <BaseNode {...props} color="#ec4899" defaultLabel="Remover Duplicatas" icon={IC.Dedup} hasTarget={true} hasSource={true} />;
}
