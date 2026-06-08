import React from 'react';
import BaseNode from './BaseNode';
import { IC } from './index';
export default function CastNode(props) {
  return <BaseNode {...props} color="#a855f7" defaultLabel="Converter Tipo" icon={IC.Cast} hasTarget={true} hasSource={true} />;
}
