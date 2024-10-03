import { Handle, Position } from '@xyflow/react';

interface TableNode {
  data: {
    label: string;
    isLinkedTable: boolean;
    gptSuggestedName: string;
    columns: {
      column_name: string;
      data_type: string;
    }[];
  }
}

const TableNode = ({ data }: TableNode) => {
  return (
    <div style={{ padding: 10, borderRadius: 5, border: '1px solid black', background: data.isLinkedTable ? '#CCCCCC' : '#f9f9f9' }}>
      <div>
        <div>
          <strong>{data.gptSuggestedName}</strong>
        </div>
        <hr/>
        <div>
          {data?.label}
        </div>
      </div> 
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
