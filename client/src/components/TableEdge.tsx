import { FC } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  Edge,
} from '@xyflow/react';

// Helper component to render the edge label
function EdgeLabel({ transform, label }: { transform: string; label: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: 'transparent',
        padding: 10,
        color: '#ff5050',
        fontSize: 12,
        fontWeight: 700,
        transform,
      }}
      className="nodrag nopan"
    >
      {label}
    </div>
  );
}

const TableEdge: FC<
  EdgeProps<Edge<{ startLabel: string }>> // Updated to handle only startLabel
> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Render the actual edge */}
      <BaseEdge id={id} path={edgePath} />
      
      {/* Render only the start label */}
      <EdgeLabelRenderer>
        {data?.startLabel && (
          <EdgeLabel
            transform={`translate(${sourceX}px,${sourceY}px)`} // Start label position
            label={data.startLabel}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default TableEdge;
