import { Handle, Position } from '@xyflow/react';

interface TableNode {
  data: {
    label: string;
    columns: {
      column_name: string;
      data_type: string;
    }[];
  }
}

const TableNode = ({ data }: TableNode) => {
  return (
    <div style={{ padding: 10, borderRadius: 5, border: '1px solid black', background: '#f9f9f9' }}>
      <strong>{data?.label}</strong>
      <ul>
        {data.columns.map((column: any, index: number) => (
          <li key={index}>
            {column.column_name} <b>({column.data_type})</b>
          </li>
        ))}
      </ul>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default TableNode;
